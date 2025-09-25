import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FanpageDocument = HydratedDocument<Fanpage>;

export enum FanpageStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REMOVED = 'removed',
}

@Schema({ timestamps: true })
export class Fanpage {
  @Prop({ required: true, unique: true, index: true })
  pageId: string;

  @Prop({ required: true })
  pageName: string;

  @Prop({ required: true })
  accessToken: string;

  @Prop({ type: String, enum: Object.values(FanpageStatus), default: FanpageStatus.ACTIVE })
  status: FanpageStatus;

  @Prop({ required: true })
  connectedAt: Date;

  @Prop()
  lastRefreshed?: Date;

  // Relations / references
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  connectedBy?: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  categories: string[];

  @Prop()
  avatarUrl?: string;

  @Prop({ type: Number, default: 0 })
  subscriberCount: number;

  @Prop({ type: Types.ObjectId, ref: 'ScriptGroup', required: false })
  defaultScriptGroupId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProductGroup', required: false })
  defaultProductGroupId?: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  webhookSubscribed: boolean;

  // Ops fields
  @Prop({ type: Number, default: 10000 })
  messageQuota: number;

  @Prop({ type: Number, default: 0 })
  messagesSentThisMonth: number;

  @Prop({ type: Boolean, default: false })
  aiEnabled: boolean;

  @Prop({ type: String, default: 'Asia/Ho_Chi_Minh' })
  timeZone: string;
}

export const FanpageSchema = SchemaFactory.createForClass(Fanpage);
