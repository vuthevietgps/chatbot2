import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ScenarioTriggerDocument = HydratedDocument<ScenarioTrigger>;

@Schema({ timestamps: true, collection: 'scenario_triggers' })
export class ScenarioTrigger {
  @Prop({ type: String, required: true, index: true })
  scenarioId: string;

  @Prop({ type: String, enum: ['keyword', 'event', 'time'], required: true })
  type: 'keyword' | 'event' | 'time';

  @Prop({ type: String, enum: ['contains', 'exact', 'regex'], default: 'exact' })
  match_mode: 'contains' | 'exact' | 'regex';

  @Prop({ type: String, default: '' })
  value: string;

  @Prop({ type: Boolean, default: true })
  is_active: boolean;
}

export const ScenarioTriggerSchema = SchemaFactory.createForClass(ScenarioTrigger);
ScenarioTriggerSchema.index({ scenarioId: 1, type: 1, value: 1 });
