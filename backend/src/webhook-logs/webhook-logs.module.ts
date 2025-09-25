import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebhookLogsService } from './webhook-logs.service';
import { WebhookLogsController } from './webhook-logs.controller';
import { WebhookLog, WebhookLogSchema } from './schemas/webhook-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WebhookLog.name, schema: WebhookLogSchema }]),
  ],
  controllers: [WebhookLogsController],
  providers: [WebhookLogsService],
  exports: [WebhookLogsService],
})
export class WebhookLogsModule {}