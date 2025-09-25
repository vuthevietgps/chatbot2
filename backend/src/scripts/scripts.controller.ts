import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ScriptsService } from './scripts.service';
import { CreateScriptDto } from './dto/create-script.dto';
import { UpdateScriptDto } from './dto/update-script.dto';

@Controller('scripts')
export class ScriptsController {
  constructor(private readonly service: ScriptsService) {}

  @Post()
  create(@Body() dto: CreateScriptDto) { return this.service.create(dto); }
  @Get()
  findAll() { return this.service.findAll(); }
  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateScriptDto) { return this.service.update(id, dto); }
  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
