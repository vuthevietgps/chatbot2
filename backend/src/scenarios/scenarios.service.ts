import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ScenarioTrigger, ScenarioTriggerDocument } from './schemas/trigger.schema';
import { CreateTriggerDto } from './dto/create-trigger.dto';
import { UpdateTriggerDto } from './dto/update-trigger.dto';
import { ScenarioNode, ScenarioNodeDocument } from './schemas/node.schema';
import { ScenarioLink, ScenarioLinkDocument } from './schemas/link.schema';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';

@Injectable()
export class ScenariosService {
  constructor(
    @InjectModel(ScenarioTrigger.name) private triggerModel: Model<ScenarioTriggerDocument>,
    @InjectModel(ScenarioNode.name) private nodeModel: Model<ScenarioNodeDocument>,
    @InjectModel(ScenarioLink.name) private linkModel: Model<ScenarioLinkDocument>,
  ) {}

  async listTriggers(scenarioId: string) {
    return this.triggerModel.find({ scenarioId }).lean();
  }

  async createTrigger(scenarioId: string, dto: CreateTriggerDto) {
    const doc = new this.triggerModel({
      scenarioId,
      type: dto.type,
      match_mode: dto.match_mode,
      value: dto.value,
      is_active: dto.is_active ?? true,
    });
    const saved = await doc.save();
    return {
      id: saved._id.toString(),
      scenario_id: scenarioId,
      type: saved.type,
      match_mode: saved.match_mode,
      value: saved.value,
      is_active: saved.is_active,
    };
  }

  async updateTrigger(triggerId: string, dto: UpdateTriggerDto) {
    const updated = await this.triggerModel.findByIdAndUpdate(triggerId, { $set: dto }, { new: true });
    if (!updated) return null;
    return {
      id: updated._id.toString(),
      scenario_id: updated.scenarioId?.toString?.() || undefined,
      type: updated.type,
      match_mode: updated.match_mode,
      value: updated.value,
      is_active: updated.is_active,
    };
  }

  async deleteTrigger(triggerId: string) {
    await this.triggerModel.findByIdAndDelete(triggerId);
    return { ok: true };
  }

  // Nodes
  async listNodes(scenarioId: string) {
    const nodes = await this.nodeModel.find({ scenarioId }).lean();
    const links = await this.linkModel.find({ scenarioId }).lean();
    return {
      nodes: nodes.map((n: any) => ({
        id: n._id.toString(),
        scenario_id: scenarioId,
        type: n.type,
        name: n.name,
        content: n.content,
        position_x: n.position_x,
        position_y: n.position_y,
        is_entry: n.is_entry,
      })),
      links: links.map((l: any) => ({
        id: l._id.toString(),
        scenario_id: scenarioId,
        from_node_id: l.from_node_id,
        to_node_id: l.to_node_id,
        condition: l.condition,
        order_index: l.order_index,
      })),
    };
  }

  async createNode(scenarioId: string, dto: CreateNodeDto) {
    const doc = await this.nodeModel.create({ scenarioId, ...dto });
    return {
      id: doc._id.toString(),
      scenario_id: scenarioId,
      type: doc.type,
      name: doc.name,
      content: doc.content,
      position_x: doc.position_x,
      position_y: doc.position_y,
      is_entry: doc.is_entry,
    };
  }

  async updateNode(nodeId: string, dto: UpdateNodeDto) {
    const u = await this.nodeModel.findByIdAndUpdate(nodeId, { $set: dto }, { new: true });
    if (!u) return null;
    return {
      id: u._id.toString(),
      scenario_id: u.scenarioId,
      type: u.type,
      name: u.name,
      content: u.content,
      position_x: u.position_x,
      position_y: u.position_y,
      is_entry: u.is_entry,
    };
  }

  async deleteNode(nodeId: string) {
    await this.nodeModel.findByIdAndDelete(nodeId);
    // Also delete links referencing it
    await this.linkModel.deleteMany({ $or: [{ from_node_id: nodeId }, { to_node_id: nodeId }] });
    return { ok: true };
  }

  // Links
  async createLink(scenarioId: string, dto: CreateLinkDto) {
    const doc = await this.linkModel.create({ scenarioId, ...dto });
    return {
      id: doc._id.toString(),
      scenario_id: scenarioId,
      from_node_id: doc.from_node_id,
      to_node_id: doc.to_node_id,
      condition: doc.condition,
      order_index: doc.order_index,
    };
  }

  async updateLink(linkId: string, dto: UpdateLinkDto) {
    const u = await this.linkModel.findByIdAndUpdate(linkId, { $set: dto }, { new: true });
    if (!u) return null;
    return {
      id: u._id.toString(),
      scenario_id: u.scenarioId,
      from_node_id: u.from_node_id,
      to_node_id: u.to_node_id,
      condition: u.condition,
      order_index: u.order_index,
    };
  }

  async deleteLink(linkId: string) {
    await this.linkModel.findByIdAndDelete(linkId);
    return { ok: true };
  }
}
