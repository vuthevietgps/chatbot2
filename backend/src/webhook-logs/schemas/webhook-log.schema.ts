import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WebhookLogDocument = WebhookLog & Document;

@Schema({ timestamps: true })
export class WebhookLog {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  pageId: string;

  @Prop({ type: Object, required: true })
  raw: any;

  @Prop({ type: Object })
  headers?: any;

  @Prop({ default: false })
  verified: boolean;

  @Prop({ required: true, type: Date })
  createdAt: Date;
}

export const WebhookLogSchema = SchemaFactory.createForClass(WebhookLog);

// Index for pageId lookup
WebhookLogSchema.index({ pageId: 1, createdAt: -1 });