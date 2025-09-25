import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  pageId: string;

  @Prop({ required: true })
  psid: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  customerId?: Types.ObjectId;

  @Prop({ 
    enum: ['open', 'closed', 'pending'], 
    default: 'open' 
  })
  status: string;

  @Prop({ required: true })
  lastMessage: string;

  @Prop({ required: true, type: Date })
  lastUpdated: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Unique index for pageId + psid
ConversationSchema.index({ pageId: 1, psid: 1 }, { unique: true });