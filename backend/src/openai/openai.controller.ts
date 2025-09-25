import { Controller, Get, Post, Body } from '@nestjs/common';
import { OpenAIService } from './openai.service';

@Controller('openai')
export class OpenAIController {
  constructor(private readonly openaiService: OpenAIService) {}

  @Get('status')
  getStatus() {
    return {
      enabled: this.openaiService.isServiceEnabled(),
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    };
  }

  @Post('test')
  async testConnection(@Body() body: { message?: string }) {
    const testMessage = body.message || 'Xin chào, đây là tin nhắn test.';
    
    const response = await this.openaiService.generateChatResponse({
      message: testMessage,
      customerName: 'Test User',
      fanpageName: 'Test Shop',
    });

    return response;
  }

  @Post('chat')
  async chat(@Body() body: {
    message: string;
    customerName?: string;
    fanpageName?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }) {
    return await this.openaiService.generateChatResponse(body);
  }
}