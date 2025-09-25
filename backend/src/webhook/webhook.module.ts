import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookProcessorService } from './webhook-processor.service';
import { ConversationsModule } from '../conversations/conversations.module';
import { MessagesModule } from '../messages/messages.module';
import { WebhookLogsModule } from '../webhook-logs/webhook-logs.module';
import { ChatBotModule } from '../chatbot/chatbot.module';

@Module({
  imports: [ConversationsModule, MessagesModule, WebhookLogsModule, ChatBotModule],
  controllers: [WebhookController],
  providers: [WebhookProcessorService],
  exports: [WebhookProcessorService],
})
export class WebhookModule {}