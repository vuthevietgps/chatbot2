import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ScriptDocument = HydratedDocument<Script>;

export enum ScriptStatus { ACTIVE = 'active', INACTIVE = 'inactive' }
export enum ScriptAction { SEND_IMAGE = 'send_image', SHOW_PRODUCT_LIST = 'show_product_list', CREATE_ORDER = 'create_order' }

@Schema({ timestamps: true })
export class Script {
  @Prop({ type: String, unique: true, index: true })
  id: string; // UUID

  @Prop({ type: Types.ObjectId, ref: 'ScriptGroup', required: true, index: true })
  scriptGroupId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: [String], default: [] })
  trigger: string[];

  @Prop({ required: true })
  responseTemplate: string;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: false })
  linkedProductId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProductGroup', required: false })
  linkedProductGroupId?: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  priority: number;

  @Prop({ type: String, enum: Object.values(ScriptStatus), default: ScriptStatus.ACTIVE })
  status: ScriptStatus;

  @Prop({ type: String, required: false })
  contextRequirement?: string;

  @Prop({ type: Boolean, default: false })
  aiAssist: boolean;

  @Prop({ type: String, enum: Object.values(ScriptAction), required: false })
  action?: ScriptAction;
}

export const ScriptSchema = SchemaFactory.createForClass(Script);
// unique per group + name to avoid duplicates by label
ScriptSchema.index({ scriptGroupId: 1, name: 1 }, { unique: true });
