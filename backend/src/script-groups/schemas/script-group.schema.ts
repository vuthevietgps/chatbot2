import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ScriptGroupDocument = HydratedDocument<ScriptGroup>;

export enum ScriptGroupStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Schema({ timestamps: true })
export class ScriptGroup {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Fanpage', required: true, index: true })
  pageId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProductGroup', required: true, index: true })
  productGroupId: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(ScriptGroupStatus), default: ScriptGroupStatus.ACTIVE })
  status: ScriptGroupStatus;

  @Prop({ type: Number, default: 0 })
  priority: number;

  @Prop({ type: Boolean, default: false })
  aiEnabled: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
}

export const ScriptGroupSchema = SchemaFactory.createForClass(ScriptGroup);
ScriptGroupSchema.index({ pageId: 1, name: 1 }, { unique: true });
