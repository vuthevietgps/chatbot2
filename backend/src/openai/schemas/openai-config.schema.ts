import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OpenAIConfigDocument = OpenAIConfig & Document;

@Schema({ timestamps: true })
export class OpenAIConfig {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  apiKey: string;

  @Prop({ 
    required: true,
    enum: ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'],
    default: 'gpt-3.5-turbo'
  })
  model: string;

  @Prop({ 
    required: true,
    min: 50,
    max: 4000,
    default: 500
  })
  maxTokens: number;

  @Prop({ 
    required: true,
    min: 0,
    max: 2,
    default: 0.7
  })
  temperature: number;

  @Prop({ 
    min: -2,
    max: 2,
    default: 0.1
  })
  presencePenalty: number;

  @Prop({ 
    min: -2,
    max: 2,
    default: 0.1
  })
  frequencyPenalty: number;

  @Prop({ required: true })
  systemPrompt: string;

  // Liên kết với Script Groups (scenarios)
  @Prop({ 
    type: [Types.ObjectId], 
    ref: 'ScriptGroup',
    default: []
  })
  applicableScenarios: Types.ObjectId[];

  // Liên kết với Fanpages
  @Prop({ 
    type: [Types.ObjectId], 
    ref: 'Fanpage',
    default: []
  })
  applicableFanpages: Types.ObjectId[];

  @Prop({ 
    enum: ['active', 'inactive'],
    default: 'active'
  })
  status: string;

  @Prop({ 
    default: true
  })
  isDefault: boolean;

  // Thống kê sử dụng
  @Prop({ default: 0 })
  totalRequests: number;

  @Prop({ default: 0 })
  totalTokensUsed: number;

  @Prop({ default: 0 })
  successfulResponses: number;

  @Prop({ default: 0 })
  failedResponses: number;

  @Prop()
  lastUsedAt?: Date;

  // Metadata
  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const OpenAIConfigSchema = SchemaFactory.createForClass(OpenAIConfig);

// Index cho tìm kiếm nhanh
OpenAIConfigSchema.index({ status: 1, isDefault: 1 });
OpenAIConfigSchema.index({ applicableScenarios: 1 });
OpenAIConfigSchema.index({ applicableFanpages: 1 });