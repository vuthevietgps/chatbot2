import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubScriptDocument = SubScript & Document;

@Schema({
  timestamps: true,
  collection: 'sub_scripts'
})
export class SubScript {
  @Prop({ type: Types.ObjectId, ref: 'ScriptGroup', required: true })
  scenario_id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: [String], default: [] })
  trigger_keywords: string[];

  @Prop({ required: true })
  response_template: string;

  @Prop({ type: Types.ObjectId, ref: 'Product', default: null })
  product_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProductGroup', default: null })
  product_group_id?: Types.ObjectId;

  @Prop({ type: Number, default: 1 })
  priority: number;

  @Prop({ 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  })
  status: string;

  @Prop({
    type: Object,
    default: {
      type: 'none',
      key: '',
      value: '',
      webhook_url: '',
      tag_name: ''
    }
  })
  action: {
    type: string;
    key?: string;
    value?: string;
    webhook_url?: string;
    tag_name?: string;
  };

  @Prop({ default: '' })
  context_required: string;

  @Prop({ type: String, default: 'contains' })
  match_mode: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  created_by: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  created_at: Date;

  @Prop({ type: Date, default: Date.now })
  updated_at: Date;
}

export const SubScriptSchema = SchemaFactory.createForClass(SubScript);

// Index for better query performance
SubScriptSchema.index({ scenario_id: 1, status: 1 });
SubScriptSchema.index({ trigger_keywords: 1, status: 1 });
SubScriptSchema.index({ priority: -1 });