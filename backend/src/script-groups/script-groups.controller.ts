import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ScriptGroupsService } from './script-groups.service';
import { CreateScriptGroupDto } from './dto/create-script-group.dto';
import { UpdateScriptGroupDto } from './dto/update-script-group.dto';

@Controller('script-groups')
export class ScriptGroupsController {
  constructor(private readonly service: ScriptGroupsService) {}

  @Post()
  create(@Body() dto: CreateScriptGroupDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateScriptGroupDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
