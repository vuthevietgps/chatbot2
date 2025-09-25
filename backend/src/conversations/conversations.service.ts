import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name) 
    private conversationModel: Model<ConversationDocument>,
  ) {}

  async create(dto: CreateConversationDto): Promise<Conversation> {
    try {
      const id = dto.id || randomUUID();
      const payload = {
        ...dto,
        id,
        lastUpdated: new Date(dto.lastUpdated),
        customerId: dto.customerId ? new Types.ObjectId(dto.customerId) : undefined,
      };
      const created = new this.conversationModel(payload);
      return await created.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('Hội thoại đã tồn tại với pageId và psid này');
      }
      throw error;
    }
  }

  async findAll(): Promise<Conversation[]> {
    return this.conversationModel
      .find()
      .populate('customerId')
      .sort({ lastUpdated: -1 })
      .lean()
      .exec();
  }

  async findOne(id: string): Promise<Conversation> {
    const conversation = await this.conversationModel
      .findOne({ id })
      .populate('customerId')
      .lean()
      .exec();
    
    if (!conversation) {
      throw new NotFoundException('Không tìm thấy hội thoại');
    }
    return conversation;
  }

  // New: find conversation by either Mongo _id or business id
  async findByAnyId(idOrObjectId: string): Promise<Conversation | null> {
    // Try MongoDB ObjectId first
    if (Types.ObjectId.isValid(idOrObjectId)) {
      const byDbId = await this.conversationModel
        .findById(idOrObjectId)
        .populate('customerId')
        .lean()
        .exec();
      if (byDbId) return byDbId;
    }

    // Fallback to business id field
    const byBusinessId = await this.conversationModel
      .findOne({ id: idOrObjectId })
      .populate('customerId')
      .lean()
      .exec();
    return byBusinessId;
  }

  async findByPageIdAndPsid(pageId: string, psid: string): Promise<Conversation | null> {
    return this.conversationModel
      .findOne({ pageId, psid })
      .populate('customerId')
      .lean()
      .exec();
  }

  async update(id: string, dto: UpdateConversationDto): Promise<Conversation> {
    const payload = {
      ...dto,
      ...(dto.lastUpdated && { lastUpdated: new Date(dto.lastUpdated) }),
      ...(dto.customerId && { customerId: new Types.ObjectId(dto.customerId) }),
    };

    const updated = await this.conversationModel
      .findOneAndUpdate({ id }, payload, { new: true })
      .populate('customerId')
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy hội thoại');
    }
    return updated;
  }

  async updateLastMessage(pageId: string, psid: string, lastMessage: string): Promise<Conversation> {
    const updated = await this.conversationModel
      .findOneAndUpdate(
        { pageId, psid },
        { 
          lastMessage, 
          lastUpdated: new Date(),
        },
        { new: true }
      )
      .populate('customerId')
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy hội thoại');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.conversationModel.deleteOne({ id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Không tìm thấy hội thoại');
    }
  }
}