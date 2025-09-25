import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ScenarioLinkDocument = HydratedDocument<ScenarioLink>;

@Schema({ timestamps: true, collection: 'scenario_links' })
export class ScenarioLink {
  @Prop({ type: String, required: true, index: true })
  scenarioId: string;

  @Prop({ type: String, required: true })
  from_node_id: string;

  @Prop({ type: String, required: true })
  to_node_id: string;

  @Prop({ type: Object, default: null })
  condition: any;

  @Prop({ type: Number, default: 0 })
  order_index: number;
}

export const ScenarioLinkSchema = SchemaFactory.createForClass(ScenarioLink);
ScenarioLinkSchema.index({ scenarioId: 1 });
