import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ScenarioNodeDocument = HydratedDocument<ScenarioNode>;

@Schema({ timestamps: true, collection: 'scenario_nodes' })
export class ScenarioNode {
  @Prop({ type: String, required: true, index: true })
  scenarioId: string;

  @Prop({ type: String, required: true, enum: ['text', 'media', 'carousel', 'quick_reply', 'form', 'action', 'wait', 'ai_reply', 'child_script'] })
  type: string;

  @Prop({ type: String, default: '' })
  name: string;

  @Prop({ type: Object, default: {} })
  content: any;

  @Prop({ type: Number, default: 0 })
  position_x: number;

  @Prop({ type: Number, default: 0 })
  position_y: number;

  @Prop({ type: Boolean, default: false })
  is_entry: boolean;
}

export const ScenarioNodeSchema = SchemaFactory.createForClass(ScenarioNode);
ScenarioNodeSchema.index({ scenarioId: 1 });
