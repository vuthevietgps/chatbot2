import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { Message, MessageDocument } from './schemas/message.schema';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationsService } from '../conversations/conversations.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { FanpagesService } from '../fanpages/fanpages.service';
import { FacebookSendService } from '../facebook/facebook-send.service';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectModel(Message.name) 
    private messageModel: Model<MessageDocument>,
    private conversationsService: ConversationsService,
    private fanpagesService: FanpagesService,
    private facebookSendService: FacebookSendService,
    private realtimeGateway: RealtimeGateway,
  ) {}

  async create(dto: CreateMessageDto): Promise<Message> {
    const id = dto.id || randomUUID();
    const payload = {
      ...dto,
      id,
      conversationId: new Types.ObjectId(dto.conversationId),
      createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
      status: dto.status || 'received',
    };

    const created = new this.messageModel(payload);
    const saved = await created.save();
    // Emit realtime event
    try {
      this.realtimeGateway.emitMessageCreated(String(saved.conversationId), saved);
    } catch (e) {
      this.logger.warn(`Realtime emit failed (message:new): ${e.message}`);
    }
    return saved;
  }

  async findAll(): Promise<Message[]> {
    return this.messageModel
      .find()
      .select({})
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
      .exec();
  }

  async findByConversationId(conversationId: string, options?: { page?: number; limit?: number; order?: 'asc' | 'desc' }): Promise<Message[]> {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(200, Math.max(1, options?.limit ?? 100));
    const sortOrder = options?.order === 'asc' ? 1 : -1;

    if (!Types.ObjectId.isValid(conversationId)) {
      // Allow using business id by looking up the conversation first
      const conv = await this.conversationsService.findByAnyId(conversationId);
      if (!conv) throw new NotFoundException('Không tìm thấy hội thoại');
      conversationId = (conv as any)._id?.toString();
    }

    return this.messageModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ createdAt: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();
  }

  async findOne(id: string): Promise<Message> {
    const message = await this.messageModel
      .findOne({ id })
      .lean()
      .exec();
    
    if (!message) {
      throw new NotFoundException('Không tìm thấy tin nhắn');
    }
    return message;
  }

  async update(id: string, dto: UpdateMessageDto): Promise<Message> {
    const payload = {
      ...dto,
      ...(dto.conversationId && { conversationId: new Types.ObjectId(dto.conversationId) }),
      ...(dto.createdAt && { createdAt: new Date(dto.createdAt) }),
    };

    const updated = await this.messageModel
      .findOneAndUpdate({ id }, payload, { new: true })
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy tin nhắn');
    }
    try {
      if (updated?.conversationId) {
        this.realtimeGateway.emitMessageUpdated(String(updated.conversationId), updated);
      }
    } catch (e) {
      this.logger.warn(`Realtime emit failed (message:updated): ${e.message}`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.messageModel.deleteOne({ id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Không tìm thấy tin nhắn');
    }
  }

  async updateMessageStatus(conversationId: string, status: string): Promise<void> {
    try {
      await this.messageModel.updateMany(
        { 
          conversationId: new Types.ObjectId(conversationId),
          direction: 'in',
          status: 'received'
        },
        { status }
      ).exec();
    } catch (error) {
      this.logger.error(`Error updating message status: ${error.message}`);
    }
  }

  async sendToConversation(conversationId: string, dto: SendMessageDto): Promise<any> {
    try {
      // 1. Get conversation details
      const conversation = await this.conversationsService.findOne(conversationId);
      if (!conversation) {
        throw new NotFoundException('Không tìm thấy hội thoại');
      }

      // 2. Get fanpage details to get access token
      const fanpages = await this.fanpagesService.findAll();
      const fanpage = fanpages.find((fp: any) => fp.pageId === conversation.pageId);
      if (!fanpage) {
        throw new NotFoundException('Không tìm thấy fanpage');
      }

      // 3. Send message via Facebook API
      const sendResult = await this.facebookSendService.sendMessage({
        pageAccessToken: fanpage.accessToken,
        recipientPsid: conversation.psid,
        text: dto.text,
        attachments: dto.attachments || [],
      });

      // 4. Create message record in database
      const messageData: CreateMessageDto = {
        conversationId: conversationId,
        pageId: conversation.pageId,
        psid: conversation.psid,
        direction: 'out',
        senderType: 'agent',
        text: dto.text,
        attachments: dto.attachments || [],
        fbMessageId: sendResult.fbMessageId,
        processedBy: 'agent',
        status: sendResult.success ? 'sent' : 'error',
        createdAt: new Date().toISOString(),
      };

      const message = await this.create(messageData);

      // 5. Update conversation last message
      await this.conversationsService.updateLastMessage(
        conversation.pageId, 
        conversation.psid, 
        dto.text
      );

      return {
        success: sendResult.success,
        fbMessageId: sendResult.fbMessageId,
        message: message,
        error: sendResult.error,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Không thể gửi tin nhắn');
    }
  }
}