import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface ChatCompletionRequest {
  message: string;
  customerName?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  fanpageName?: string;
  businessContext?: any;
  config?: {
    model: string;
    apiKey: string;
    systemPrompt: string;
    maxTokens: number;
    temperature: number;
  };
}

export interface ChatCompletionResponse {
  success: boolean;
  response?: string;
  error?: string;
  tokensUsed?: number;
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private openai: OpenAI;
  private isEnabled: boolean;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.isEnabled = !!apiKey;
    
    if (this.isEnabled) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
      this.logger.log('OpenAI service initialized');
    } else {
      this.logger.warn('OpenAI API key not found. AI responses disabled.');
    }
  }

  async generateChatResponse(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.isEnabled) {
      return {
        success: false,
        error: 'OpenAI service is not enabled'
      };
    }

    try {
      const systemPrompt = this.buildSystemPrompt(request);
      const userMessage = request.message;

      // Build conversation history
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt }
      ];

      // Add conversation history if provided
      if (request.conversationHistory && request.conversationHistory.length > 0) {
        // Only keep last 10 messages to avoid token limit
        const recentHistory = request.conversationHistory.slice(-10);
        messages.push(...recentHistory);
      }

      // Add current user message
      messages.push({ role: 'user', content: userMessage });

      const completion = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo',
        messages,
        max_tokens: parseInt(this.configService.get<string>('OPENAI_MAX_TOKENS') || '500'),
        temperature: parseFloat(this.configService.get<string>('OPENAI_TEMPERATURE') || '0.7'),
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const response = completion.choices[0]?.message?.content;
      const tokensUsed = completion.usage?.total_tokens;

      if (!response) {
        return {
          success: false,
          error: 'No response generated from OpenAI'
        };
      }

      this.logger.debug(`OpenAI response generated. Tokens used: ${tokensUsed}`);

      return {
        success: true,
        response: response.trim(),
        tokensUsed
      };

    } catch (error) {
      this.logger.error(`OpenAI API error: ${error.message}`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private buildSystemPrompt(request: ChatCompletionRequest): string {
    const basePrompt = this.configService.get<string>('OPENAI_SYSTEM_PROMPT') || this.getDefaultSystemPrompt();
    const fanpageName = request.fanpageName || 'shop';
    const customerName = request.customerName || 'bạn';

    // Replace template variables
    let prompt = basePrompt
      .replace(/\{\{fanpageName\}\}/g, fanpageName)
      .replace(/\{\{customerName\}\}/g, customerName)
      .replace(/\{\{currentTime\}\}/g, new Date().toLocaleString('vi-VN'))
      .replace(/\{\{currentDate\}\}/g, new Date().toLocaleDateString('vi-VN'));

    // Add business context if provided
    if (request.businessContext) {
      prompt += `\n\nThông tin về doanh nghiệp:\n${JSON.stringify(request.businessContext, null, 2)}`;
    }

    return prompt;
  }

  private getDefaultSystemPrompt(): string {
    return `Bạn là một trợ lý AI thông minh đại diện cho {{fanpageName}}. 

Nhiệm vụ của bạn:
- Trả lời câu hỏi của khách hàng một cách thân thiện, chuyên nghiệp
- Hỗ trợ khách hàng về sản phẩm, dịch vụ, chính sách
- Khi không chắc chắn thông tin, hãy lịch sự chuyển cho nhân viên hỗ trợ
- Sử dụng ngôn ngữ Tiếng Việt tự nhiên, thân thiện
- Giữ câu trả lời ngắn gọn, dễ hiểu (tối đa 200 từ)

Quy tắc quan trọng:
- Luôn xưng hô "mình" và gọi khách hàng là "{{customerName}}"
- Không đưa ra thông tin không chính xác về giá cả, chính sách
- Khi khách hàng hỏi về thông tin cụ thể mà bạn không biết, hãy nói "Mình sẽ kết nối {{customerName}} với nhân viên để được hỗ trợ tốt nhất ạ"
- Luôn kết thúc bằng câu hỏi hoặc lời mời tiếp tục trò chuyện

Thời gian hiện tại: {{currentTime}}
Ngày hiện tại: {{currentDate}}`;
  }

  // Check if OpenAI service is available
  isServiceEnabled(): boolean {
    return this.isEnabled;
  }

  // Test connection to OpenAI
  async testConnection(): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      const response = await this.generateChatResponse({
        message: 'Hello, this is a test message.',
      });
      return response.success;
    } catch (error) {
      this.logger.error(`OpenAI connection test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate chat response using specific configuration from database
   */
  async generateChatResponseWithConfig(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!request.config) {
      // Fallback to environment-based config
      return this.generateChatResponse(request);
    }

    try {
      // Create OpenAI instance with custom API key
      const customOpenAI = new OpenAI({
        apiKey: request.config.apiKey,
      });

      // Build messages array
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

      // System prompt from config
      messages.push({
        role: 'system',
        content: request.config.systemPrompt
      });

      // Add conversation history
      if (request.conversationHistory && request.conversationHistory.length > 0) {
        for (const msg of request.conversationHistory) {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }

      // Add current user message
      messages.push({
        role: 'user',
        content: request.message
      });

      this.logger.log(`Generating response with config model: ${request.config.model}`);

      // Generate completion
      const completion = await customOpenAI.chat.completions.create({
        model: request.config.model,
        messages,
        max_tokens: request.config.maxTokens,
        temperature: request.config.temperature,
        stream: false,
      });

      const response = completion.choices[0]?.message?.content;
      const tokensUsed = completion.usage?.total_tokens || 0;

      if (!response) {
        return {
          success: false,
          error: 'No response generated',
          tokensUsed
        };
      }

      this.logger.log(`OpenAI response generated successfully. Model: ${request.config.model}, Tokens: ${tokensUsed}`);

      return {
        success: true,
        response: response.trim(),
        tokensUsed
      };

    } catch (error) {
      this.logger.error(`OpenAI API error with custom config: ${error.message}`, error);
      
      // Return more specific error messages
      if (error.status === 401) {
        return {
          success: false,
          error: 'API key không hợp lệ'
        };
      } else if (error.status === 403) {
        return {
          success: false,
          error: 'Không có quyền truy cập model này'
        };
      } else if (error.status === 429) {
        return {
          success: false,
          error: 'Đã vượt quá giới hạn rate limit'
        };
      } else {
        return {
          success: false,
          error: error.message || 'Unknown OpenAI error'
        };
      }
    }
  }
}