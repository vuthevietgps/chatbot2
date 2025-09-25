import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId: Types.ObjectId;

  @Prop({ required: true })
  pageId: string;

  @Prop({ required: true })
  psid: string;

  @Prop({ 
    enum: ['in', 'out'], 
    required: true 
  })
  direction: string;

  @Prop({ 
    enum: ['customer', 'bot', 'agent'], 
    required: true 
  })
  senderType: string;

  @Prop({ required: true })
  text: string;

  @Prop({ 
    type: [{ type: Object }], 
    default: [] 
  })
  attachments: any[];

  @Prop({ type: String })
  fbMessageId?: string;

  @Prop({ 
    enum: ['script', 'ai', 'agent', 'none'], 
    default: 'none' 
  })
  processedBy: string;

  @Prop({ 
    enum: ['received', 'processed', 'sent', 'error'], 
    default: 'received' 
  })
  status: string;

  @Prop({ required: true, type: Date })
  createdAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Index for efficient conversation lookup
MessageSchema.index({ conversationId: 1, createdAt: -1 });