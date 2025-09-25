import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  @Post()
  create(@Body() createMessageDto: CreateMessageDto) {
    return this.messagesService.create(createMessageDto);
  }

  // Optional REST hook for typing indicator (if frontend prefers HTTP)
  @Post('typing/:conversationId')
  typing(
    @Param('conversationId') conversationId: string,
    @Body() body: { userId: string; isTyping: boolean },
  ) {
    this.realtimeGateway.onTyping({ conversationId, userId: body?.userId, isTyping: !!body?.isTyping });
    return { status: 'OK' };
  }

  @Get()
  findAll() {
    return this.messagesService.findAll();
  }

  @Get('by-conversation/:conversationId')
  findByConversationId(
    @Param('conversationId') conversationId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('order') order?: 'asc' | 'desc',
  ) {
    return this.messagesService.findByConversationId(conversationId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      order,
    });
  }

  @Post('send-to-conversation/:conversationId')
  sendToConversation(
    @Param('conversationId') conversationId: string,
    @Body() sendMessageDto: SendMessageDto
  ) {
    return this.messagesService.sendToConversation(conversationId, sendMessageDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.messagesService.update(id, updateMessageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messagesService.remove(id);
  }
}