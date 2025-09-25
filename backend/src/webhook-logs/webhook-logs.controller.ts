import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WebhookLogsService } from './webhook-logs.service';
import { CreateWebhookLogDto } from './dto/create-webhook-log.dto';
import { UpdateWebhookLogDto } from './dto/update-webhook-log.dto';

@Controller('webhook-logs')
export class WebhookLogsController {
  constructor(private readonly webhookLogsService: WebhookLogsService) {}

  @Post()
  create(@Body() createWebhookLogDto: CreateWebhookLogDto) {
    return this.webhookLogsService.create(createWebhookLogDto);
  }

  @Get()
  findAll() {
    return this.webhookLogsService.findAll();
  }

  @Get('by-page/:pageId')
  findByPageId(@Param('pageId') pageId: string) {
    return this.webhookLogsService.findByPageId(pageId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.webhookLogsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWebhookLogDto: UpdateWebhookLogDto) {
    return this.webhookLogsService.update(id, updateWebhookLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.webhookLogsService.remove(id);
  }
}