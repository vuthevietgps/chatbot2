import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ScenariosService } from './scenarios.service';
import { CreateTriggerDto } from './dto/create-trigger.dto';
import { UpdateTriggerDto } from './dto/update-trigger.dto';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';

@Controller('api/chat/scenarios')
export class ScenariosController {
  constructor(private readonly service: ScenariosService) {}

  @Get(':id/triggers')
  async listTriggers(@Param('id') id: string) {
    const items = await this.service.listTriggers(id);
    return items.map((t: any) => ({
      id: t._id.toString(),
      scenario_id: id,
      type: t.type,
      match_mode: t.match_mode,
      value: t.value,
      is_active: t.is_active,
    }));
  }

  @Post(':id/triggers')
  createTrigger(@Param('id') id: string, @Body() dto: CreateTriggerDto) {
    return this.service.createTrigger(id, dto);
  }

  @Put('triggers/:triggerId')
  updateTrigger(@Param('triggerId') triggerId: string, @Body() dto: UpdateTriggerDto) {
    return this.service.updateTrigger(triggerId, dto);
  }

  @Delete('triggers/:triggerId')
  deleteTrigger(@Param('triggerId') triggerId: string) {
    return this.service.deleteTrigger(triggerId);
  }

  // Nodes and Links
  @Get(':id/nodes')
  listNodes(@Param('id') id: string) {
    return this.service.listNodes(id);
  }

  @Post(':id/nodes')
  createNode(@Param('id') id: string, @Body() dto: CreateNodeDto) {
    return this.service.createNode(id, dto);
  }

  @Put('nodes/:nodeId')
  updateNode(@Param('nodeId') nodeId: string, @Body() dto: UpdateNodeDto) {
    return this.service.updateNode(nodeId, dto);
  }

  @Delete('nodes/:nodeId')
  deleteNode(@Param('nodeId') nodeId: string) {
    return this.service.deleteNode(nodeId);
  }

  @Post(':id/links')
  createLink(@Param('id') id: string, @Body() dto: CreateLinkDto) {
    return this.service.createLink(id, dto);
  }

  @Put('links/:linkId')
  updateLink(@Param('linkId') linkId: string, @Body() dto: UpdateLinkDto) {
    return this.service.updateLink(linkId, dto);
  }

  @Delete('links/:linkId')
  deleteLink(@Param('linkId') linkId: string) {
    return this.service.deleteLink(linkId);
  }
}
