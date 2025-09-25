import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SubScript, SubScriptDocument } from '../sub-scripts/schemas/sub-script.schema';
import { Script, ScriptDocument } from '../scripts/schemas/script.schema';
import { Fanpage, FanpageDocument } from '../fanpages/schemas/fanpage.schema';
import { FacebookSendService } from '../facebook/facebook-send.service';
import { MessagesService } from '../messages/messages.service';
import { CustomersService } from '../customers/customers.service';
import { OpenAIService } from '../openai/openai.service';
import { OpenAIConfigService } from '../openai/openai-config.service';

export interface ChatBotMatch {
  script?: any;
  subScript?: any;
  response: string;
  confidence: number;
  processedBy: 'script' | 'ai';
}

interface ProcessingContext {
  pageId: string;
  psid: string;
  messageText: string;
  conversationId: string;
  fanpage: any;
}

@Injectable()
export class ChatBotProcessorService {
  private readonly logger = new Logger(ChatBotProcessorService.name);
  private readonly CONFIDENCE_THRESHOLD = 0.6;
  private readonly TYPING_DELAY = 1000;
  private readonly MAX_CONVERSATION_HISTORY = 10;

  constructor(
    @InjectModel(SubScript.name) private subScriptModel: Model<SubScriptDocument>,
    @InjectModel(Script.name) private scriptModel: Model<ScriptDocument>,
    @InjectModel(Fanpage.name) private fanpageModel: Model<FanpageDocument>,
    private facebookSendService: FacebookSendService,
    private messagesService: MessagesService,
    private customersService: CustomersService,
    private openaiService: OpenAIService,
    private openaiConfigService: OpenAIConfigService,
  ) {}

  /**
   * Main entry point - Process incoming message for chatbot automation
   */
  async processIncomingMessage(
    pageId: string, 
    psid: string, 
    messageText: string,
    conversationId: string
  ): Promise<boolean> {
    try {
      this.logger.log(`Processing chatbot: pageId=${pageId}, psid=${psid}, text="${this.truncateText(messageText)}"`);

      // 1. Validate and get fanpage
      const fanpage = await this.getFanpage(pageId);
      if (!fanpage || !fanpage.aiEnabled) {
        this.logger.log(`Chatbot disabled or fanpage not found: ${pageId}`);
        return false;
      }

      const context: ProcessingContext = {
        pageId,
        psid,
        messageText,
        conversationId,
        fanpage
      };

      // 2. Try script matching first
      const scriptMatch = await this.findBestScriptMatch(context);
      if (scriptMatch) {
        return await this.processScriptMatch(context, scriptMatch);
      }

      // 3. Fallback to AI if no script matches
      this.logger.log(`No script match found, trying AI for: "${this.truncateText(messageText)}"`);
      return await this.processWithAI(context);

    } catch (error) {
      this.logger.error(`Chatbot processing failed: ${error.message}`, error);
      return false;
    }
  }

  /**
   * Get and validate fanpage
   */
  private async getFanpage(pageId: string): Promise<any> {
    const fanpage = await this.fanpageModel.findOne({ pageId }).exec();
    if (!fanpage) {
      this.logger.warn(`Fanpage not found: ${pageId}`);
      return null;
    }
    return fanpage;
  }

  /**
   * Find best matching script with confidence scoring
   */
  private async findBestScriptMatch(context: ProcessingContext): Promise<ChatBotMatch | null> {
    const { messageText, fanpage } = context;
    const defaultScriptGroupId = fanpage.defaultScriptGroupId?.toString();
    
    try {
      // Check both sub-scripts and main scripts in parallel
      const [subScriptMatch, scriptMatch] = await Promise.all([
        this.findSubScriptMatch(messageText, defaultScriptGroupId),
        this.findScriptMatch(messageText, defaultScriptGroupId)
      ]);

      // Return the best match above threshold
      const bestMatch = [subScriptMatch, scriptMatch]
        .filter(match => match && match.confidence >= this.CONFIDENCE_THRESHOLD)
        .sort((a, b) => b.confidence - a.confidence)[0];

      return bestMatch || null;
      
    } catch (error) {
      this.logger.error(`Error finding script match: ${error.message}`);
      return null;
    }
  }

  /**
   * Find matching sub-script
   */
  private async findSubScriptMatch(messageText: string, scenarioId?: string): Promise<ChatBotMatch | null> {
    const filter: any = { status: 'active' };
    if (scenarioId) filter.scenario_id = scenarioId;

    const subScripts = await this.subScriptModel.find(filter).sort({ priority: -1 }).exec();
    return this.findMatchInScripts(messageText, subScripts, 'subScript');
  }

  /**
   * Find matching main script
   */
  private async findScriptMatch(messageText: string, scenarioId?: string): Promise<ChatBotMatch | null> {
    const filter: any = { status: 'active' };
    if (scenarioId) filter.scriptGroupId = scenarioId;

    const scripts = await this.scriptModel.find(filter).sort({ priority: -1 }).exec();
    return this.findMatchInScripts(messageText, scripts, 'script');
  }

  /**
   * Generic script matching helper
   */
  private findMatchInScripts(messageText: string, scripts: any[], type: 'script' | 'subScript'): ChatBotMatch | null {
    for (const script of scripts) {
      const triggers = type === 'subScript' ? script.trigger_keywords : script.trigger;
      const matchMode = type === 'subScript' ? script.match_mode : 'contains';
      const response = type === 'subScript' ? script.response_template : script.responseTemplate;
      
      const confidence = this.calculateKeywordConfidence(messageText, triggers, matchMode);
      
      if (confidence > 0) {
        return {
          [type]: script,
          response,
          confidence,
          processedBy: 'script'
        };
      }
    }
    return null;
  }

  /**
   * Calculate keyword matching confidence
   */
  private calculateKeywordConfidence(
    text: string, 
    keywords: string[], 
    matchMode: string = 'contains'
  ): number {
    if (!keywords || keywords.length === 0) return 0;

    const normalizedText = text.toLowerCase().trim();
    let matches = 0;
    const totalWords = keywords.length;

    for (const keyword of keywords) {
      const kw = keyword.toLowerCase().trim();
      if (!kw) continue;

      let isMatch = false;
      
      switch (matchMode) {
        case 'exact':
          isMatch = normalizedText === kw;
          break;
        case 'startswith':
          isMatch = normalizedText.startsWith(kw);
          break;
        case 'regex':
          try {
            const regex = new RegExp(kw, 'i');
            isMatch = regex.test(normalizedText);
          } catch (e) {
            // Fallback to contains if regex is invalid
            isMatch = normalizedText.includes(kw);
          }
          break;
        case 'contains':
        default:
          isMatch = normalizedText.includes(kw);
          break;
      }

      if (isMatch) {
        matches++;
        // Boost confidence for exact matches
        if (matchMode === 'exact' && normalizedText === kw) {
          return 1.0;
        }
      }
    }

    // Calculate confidence based on match ratio
    const confidence = matches / totalWords;
    
    // Boost confidence if multiple keywords match
    return matches > 1 ? Math.min(confidence * 1.2, 1.0) : confidence;
  }

  /**
   * Process script match and send response
   */
  private async processScriptMatch(context: ProcessingContext, match: ChatBotMatch): Promise<boolean> {
    try {
      this.logger.log(`Script matched with confidence: ${match.confidence.toFixed(2)}`);

      // 1. Generate personalized response
      const personalizedResponse = await this.generatePersonalizedResponse(match, context);

      // 2. Execute script actions (tags, variables, etc.)
      await this.executeScriptActions(match, context);

      // 3. Send response
      const success = await this.sendBotResponse(
        context.pageId, 
        context.psid, 
        personalizedResponse, 
        context.conversationId, 
        'script'
      );

      if (success) {
        this.logger.log(`Script response sent successfully`);
        return true;
      }

      return false;

    } catch (error) {
      this.logger.error(`Error processing script match: ${error.message}`, error);
      return false;
    }
  }

  /**
   * Process message using OpenAI when no script matches
   */
  private async processWithAI(context: ProcessingContext): Promise<boolean> {
    try {
      this.logger.log(`Processing with OpenAI for pageId=${context.pageId}`);

      // 1. Find appropriate OpenAI configuration 
      const openaiConfig = await this.findOpenAIConfig(context.fanpage);
      if (!openaiConfig) {
        this.logger.warn(`No OpenAI configuration found for pageId=${context.pageId}`);
        return false;
      }

      this.logger.log(`Using OpenAI config: ${openaiConfig.name} (${openaiConfig.model})`);

      // 2. Get customer info and conversation history
      const [customer, conversationHistory] = await Promise.all([
        this.customersService.findByFacebookId(context.psid, context.pageId),
        this.getConversationHistory(context.conversationId)
      ]);

      // 3. Generate AI response using config
      const aiResponse = await this.openaiService.generateChatResponseWithConfig({
        message: context.messageText,
        customerName: customer?.name || 'bạn',
        fanpageName: context.fanpage.pageName || 'shop',
        conversationHistory,
        businessContext: {
          fanpageCategories: context.fanpage.categories,
          timeZone: context.fanpage.timeZone,
        },
        config: {
          model: openaiConfig.model,
          apiKey: openaiConfig.apiKey,
          systemPrompt: openaiConfig.systemPrompt || 'You are a helpful customer service assistant.',
          maxTokens: openaiConfig.maxTokens || 1000,
          temperature: openaiConfig.temperature || 0.7,
        }
      });

      // Update usage statistics
      await this.openaiConfigService.updateUsageStats(
        openaiConfig._id.toString(), 
        aiResponse.tokensUsed || 0, 
        aiResponse.success
      );

      if (!aiResponse.success || !aiResponse.response) {
        this.logger.warn(`OpenAI failed: ${aiResponse.error}`);
        return false;
      }

      // 4. Send AI response
      const success = await this.sendBotResponse(
        context.pageId, 
        context.psid, 
        aiResponse.response, 
        context.conversationId, 
        'ai'
      );

      if (success) {
        this.logger.log(`AI response sent successfully. Config: ${openaiConfig.name}, Tokens: ${aiResponse.tokensUsed}`);
      }

      return success;

    } catch (error) {
      this.logger.error(`OpenAI processing failed: ${error.message}`, error);
      return false;
    }
  }

  /**
   * Find appropriate OpenAI configuration based on priority
   */
  private async findOpenAIConfig(fanpage: any): Promise<any> {
    // Priority 1: Fanpage-specific config
    if (fanpage._id) {
      const fanpageConfig = await this.openaiConfigService.findByFanpage(fanpage._id.toString());
      if (fanpageConfig) return fanpageConfig;
    }
    
    // Priority 2: Scenario-specific config
    if (fanpage.defaultScriptGroupId) {
      const scenarioConfig = await this.openaiConfigService.findByScenario(fanpage.defaultScriptGroupId.toString());
      if (scenarioConfig) return scenarioConfig;
    }
    
    // Priority 3: Default config
    return await this.openaiConfigService.findDefault();
  }

  /**
   * Generate personalized response with variable substitution
   */
  private async generatePersonalizedResponse(match: ChatBotMatch, context: ProcessingContext): Promise<string> {
    try {
      const customer = await this.customersService.findByFacebookId(context.psid, context.pageId);
      const now = new Date();

      const variables = {
        '{{name}}': customer?.name || 'Bạn',
        '{{phone}}': customer?.phone || '',
        '{{email}}': customer?.email || '',
        '{{time}}': now.toLocaleTimeString('vi-VN'),
        '{{date}}': now.toLocaleDateString('vi-VN')
      };

      return Object.entries(variables).reduce(
        (response, [key, value]) => response.replace(new RegExp(key, 'g'), value),
        match.response
      );
      
    } catch (error) {
      this.logger.error(`Error generating response: ${error.message}`);
      return match.response;
    }
  }

  /**
   * Execute script actions (tags, variables, webhooks)
   */
  private async executeScriptActions(match: ChatBotMatch, context: ProcessingContext): Promise<void> {
    try {
      const action = match.subScript?.action || match.script?.action;
      if (!action || action.type === 'none') return;

      const actionHandlers = {
        add_tag: () => this.addCustomerTag(action.tag_name, context),
        set_variable: () => this.setCustomerVariable(action.variable_name, action.variable_value, context),
        webhook: () => this.executeWebhook(action.webhook_url, context)
      };

      const handler = actionHandlers[action.type];
      if (handler) {
        await handler();
        this.logger.log(`Action executed: ${action.type}`);
      } else {
        this.logger.warn(`Unknown action type: ${action.type}`);
      }

    } catch (error) {
      this.logger.error(`Error executing script actions: ${error.message}`);
    }
  }

  private async addCustomerTag(tagName: string, context: ProcessingContext): Promise<void> {
    if (!tagName) return;
    await this.customersService.updateFromScript(context.psid, context.pageId, {
      tags: [tagName]
    });
  }

  private async setCustomerVariable(variableName: string, variableValue: string, context: ProcessingContext): Promise<void> {
    if (!variableName || !variableValue) return;
    await this.customersService.updateFromScript(context.psid, context.pageId, {
      variables: { [variableName]: variableValue }
    });
  }

  /**
   * Execute webhook action
   */
  private async executeWebhook(webhookUrl: string, context: ProcessingContext): Promise<void> {
    if (!webhookUrl) return;
    
    try {
      const payload = {
        pageId: context.pageId,
        psid: context.psid,
        messageText: context.messageText,
        conversationId: context.conversationId,
        timestamp: new Date().toISOString()
      };

      // Execute webhook in background (implement HTTP call based on requirements)
      this.logger.log(`Webhook queued: ${webhookUrl}`);
      
    } catch (error) {
      this.logger.error(`Webhook execution error: ${error.message}`);
    }
  }

  /**
   * Get conversation history for AI context
   */
  private async getConversationHistory(conversationId: string): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    try {
      const messages = await this.messagesService.findByConversationId(conversationId, {
        limit: this.MAX_CONVERSATION_HISTORY,
        order: 'desc'
      });

      return messages
        .reverse()
        .map(msg => ({
          role: msg.direction === 'in' ? 'user' as const : 'assistant' as const,
          content: msg.text
        }));

    } catch (error) {
      this.logger.error(`Error getting conversation history: ${error.message}`);
      return [];
    }
  }

  /**
   * Send bot response with typing indicators
   */
  private async sendBotResponse(
    pageId: string, 
    psid: string, 
    responseText: string,
    conversationId: string,
    processedBy: 'script' | 'ai' = 'script'
  ): Promise<boolean> {
    try {
      const fanpage = await this.fanpageModel.findOne({ pageId }).exec();
      if (!fanpage?.accessToken) {
        this.logger.error(`No access token found for fanpage: ${pageId}`);
        return false;
      }

      // 1. Send typing indicator
      await this.facebookSendService.sendTypingOn(fanpage.accessToken, psid);
      
      // 2. Natural delay
      await this.delay(this.TYPING_DELAY);

      // 3. Send message
      const sendResult = await this.facebookSendService.sendMessage({
        pageAccessToken: fanpage.accessToken,
        recipientPsid: psid,
        text: responseText,
        attachments: []
      });

      if (!sendResult.success) {
        this.logger.error(`Failed to send bot message: ${sendResult.error}`);
        return false;
      }

      // 4. Stop typing indicator
      await this.facebookSendService.sendTypingOff(fanpage.accessToken, psid);

      // 5. Save message to database
      await this.messagesService.create({
        conversationId,
        pageId,
        psid,
        direction: 'out',
        senderType: 'bot',
        text: responseText,
        attachments: [],
        fbMessageId: sendResult.fbMessageId,
        processedBy,
        status: 'sent',
        createdAt: new Date().toISOString(),
      });

      // 6. Update message quota
      await this.updateMessageQuota(pageId);

      return true;
      
    } catch (error) {
      this.logger.error(`Error sending bot response: ${error.message}`, error);
      return false;
    }
  }

  /**
   * Update fanpage message quota
   */
  private async updateMessageQuota(pageId: string): Promise<void> {
    try {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      await this.fanpageModel.findOneAndUpdate(
        { pageId },
        { 
          $inc: { messagesSentThisMonth: 1 },
          $set: { [`monthlyStats.${currentMonth}.sent`]: { $inc: 1 } }
        }
      ).exec();

    } catch (error) {
      this.logger.error(`Error updating message quota: ${error.message}`);
    }
  }

  /**
   * Utility functions
   */
  private truncateText(text: string, maxLength: number = 50): string {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}