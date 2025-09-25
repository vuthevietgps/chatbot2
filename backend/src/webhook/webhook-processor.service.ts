import { Injectable, Logger } from '@nestjs/common';
import { ConversationsService } from '../conversations/conversations.service';
import { MessagesService } from '../messages/messages.service';
import { WebhookLogsService } from '../webhook-logs/webhook-logs.service';
import { ChatBotProcessorService } from '../chatbot/chatbot-processor.service';
import { randomUUID } from 'crypto';

@Injectable()
export class WebhookProcessorService {
  private readonly logger = new Logger(WebhookProcessorService.name);

  constructor(
    private conversationsService: ConversationsService,
    private messagesService: MessagesService,
    private webhookLogsService: WebhookLogsService,
    private chatBotProcessorService: ChatBotProcessorService,
  ) {}

  async processWebhookPayload(pageId: string, payload: any, headers: any = {}): Promise<void> {
    try {
      // 1. Log webhook payload
      await this.webhookLogsService.create({
        pageId,
        raw: payload,
        headers,
        verified: true,
        createdAt: new Date().toISOString(),
      });

      // 2. Process entries
      if (payload.entry && Array.isArray(payload.entry)) {
        for (const entry of payload.entry) {
          await this.processEntry(pageId, entry);
        }
      }

      this.logger.log(`Webhook processed for pageId: ${pageId}`);
    } catch (error) {
      this.logger.error(`Webhook processing failed for pageId: ${pageId}`, error);
      throw error;
    }
  }

  private async processEntry(pageId: string, entry: any): Promise<void> {
    if (entry.messaging && Array.isArray(entry.messaging)) {
      for (const messagingEvent of entry.messaging) {
        await this.processMessagingEvent(pageId, messagingEvent);
      }
    }
  }

  private async processMessagingEvent(pageId: string, messagingEvent: any): Promise<void> {
    const psid = messagingEvent.sender?.id;
    if (!psid) return;

    // Handle incoming message
    if (messagingEvent.message) {
      await this.handleIncomingMessage(pageId, psid, messagingEvent);
    }

    // Handle delivery confirmation
    if (messagingEvent.delivery) {
      this.logger.log(`Message delivery confirmed for psid: ${psid}`);
    }

    // Handle read confirmation  
    if (messagingEvent.read) {
      this.logger.log(`Message read confirmed for psid: ${psid}`);
    }
  }

  private async handleIncomingMessage(pageId: string, psid: string, messagingEvent: any): Promise<void> {
    const messageData = messagingEvent.message;
    const messageText = messageData.text || '[Attachment/Sticker]';
    const attachments = messageData.attachments || [];

    try {
      // 1. Find or create conversation
      let conversation = await this.conversationsService.findByPageIdAndPsid(pageId, psid);
      
      if (!conversation) {
        // Ensure highly unique business id to avoid rare collisions
        conversation = await this.conversationsService.create({
          id: `conv_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          pageId,
          psid,
          status: 'open',
          lastMessage: messageText,
          lastUpdated: new Date().toISOString(),
        });
      } else {
        // Update existing conversation
        await this.conversationsService.updateLastMessage(pageId, psid, messageText);
      }

      // 2. Create message record
      await this.messagesService.create({
        conversationId: (conversation as any)._id.toString(),
        pageId,
        psid,
        direction: 'in',
        senderType: 'customer',
        text: messageText,
        attachments,
        status: 'received',
        createdAt: new Date().toISOString(),
      });

      // 3. CHATBOT AUTOMATION - Try to process with chatbot
      const conversationId = (conversation as any)._id.toString();
      
      try {
        const botProcessed = await this.chatBotProcessorService.processIncomingMessage(
          pageId,
          psid,
          messageText,
          conversationId
        );

        if (botProcessed) {
          this.logger.log(`✅ Bot processed successfully: pageId=${pageId}, psid=${psid}`);
          
          // Update message status to processed
          await this.messagesService.updateMessageStatus(
            (conversation as any)._id.toString(),
            'processed'
          );
        } else {
          this.logger.log(`⚠️ Bot could not process, fallback to agent: pageId=${pageId}, psid=${psid}`);
          // Message stays in 'received' status for agent to handle
        }
      } catch (botError) {
        this.logger.error(`🚨 ChatBot processing error, fallback to agent: ${botError.message}`);
        // Continue to agent fallback - do not throw error
      }

      this.logger.log(`Message processed: pageId=${pageId}, psid=${psid}, text=${messageText.substring(0, 50)}...`);
    } catch (error) {
      this.logger.error(`Failed to handle incoming message: pageId=${pageId}, psid=${psid}`, error);
      throw error;
    }
  }

  async sendOutboundMessage(
    pageId: string, 
    psid: string, 
    text: string, 
    senderType: 'bot' | 'agent' = 'bot'
  ): Promise<void> {
    try {
      // 1. Find conversation
      const conversation = await this.conversationsService.findByPageIdAndPsid(pageId, psid);
      if (!conversation) {
        throw new Error(`No conversation found for pageId=${pageId}, psid=${psid}`);
      }

      // 2. Create outbound message record
      await this.messagesService.create({
        conversationId: (conversation as any)._id.toString(),
        pageId,
        psid,
        direction: 'out',
        senderType,
        text,
        attachments: [],
        status: 'sent',
        createdAt: new Date().toISOString(),
      });

      // 3. Update conversation last message
      await this.conversationsService.updateLastMessage(pageId, psid, text);

      this.logger.log(`Outbound message recorded: pageId=${pageId}, psid=${psid}, senderType=${senderType}`);
    } catch (error) {
      this.logger.error(`Failed to record outbound message: pageId=${pageId}, psid=${psid}`, error);
      throw error;
    }
  }
}