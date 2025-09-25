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

@Injectable()
export class ChatBotProcessorService {
  private readonly logger = new Logger(ChatBotProcessorService.name);

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
      this.logger.log(`Processing chatbot for pageId=${pageId}, psid=${psid}, text="${messageText.substring(0, 50)}..."`);

      // 1. Get fanpage and check if AI/chatbot is enabled
      const fanpage = await this.fanpageModel.findOne({ pageId }).exec();
      if (!fanpage) {
        this.logger.warn(`Fanpage not found: ${pageId}`);
        return false;
      }

      if (!fanpage.aiEnabled) {
        this.logger.log(`AI/Chatbot disabled for fanpage: ${pageId}`);
        return false;
      }

      // 2. Find matching scripts
      const match = await this.findBestMatch(messageText, pageId, fanpage.defaultScriptGroupId?.toString());
      
      if (!match) {
        this.logger.log(`No script match found for: "${messageText}"`);
        
        // 2.1. Try OpenAI as fallback if enabled
        if (this.openaiService.isServiceEnabled()) {
          return await this.processWithOpenAI(messageText, pageId, psid, conversationId, fanpage);
        }
        
        return false; // Fallback to agent
      }

      // 3. Generate response
      const response = await this.generateResponse(match, psid, pageId);
      
      // 4. Send bot response
      const success = await this.sendBotResponse(pageId, psid, response, conversationId);
      
      if (success) {
        this.logger.log(`Bot response sent successfully: "${response.substring(0, 50)}..."`);
        
        // 5. Execute script actions if any
        await this.executeScriptActions(match, psid, pageId);
        
        return true; // Processed by bot
      }

      return false; // Failed, fallback to agent
      
    } catch (error) {
      this.logger.error(`ChatBot processing failed: ${error.message}`, error);
      return false; // Fallback to agent on error
    }
  }

  /**
   * Find best matching script for incoming message
   */
  private async findBestMatch(messageText: string, pageId: string, defaultScriptGroupId?: string): Promise<ChatBotMatch | null> {
    const text = messageText.toLowerCase().trim();
    let bestMatch: ChatBotMatch | null = null;
    let highestConfidence = 0;

    try {
      // Priority 1: Check Sub-Scripts (more advanced)
      const subScriptMatch = await this.findSubScriptMatch(text, defaultScriptGroupId);
      if (subScriptMatch && subScriptMatch.confidence > highestConfidence) {
        bestMatch = subScriptMatch;
        highestConfidence = subScriptMatch.confidence;
      }

      // Priority 2: Check Main Scripts  
      const scriptMatch = await this.findScriptMatch(text, defaultScriptGroupId);
      if (scriptMatch && scriptMatch.confidence > highestConfidence) {
        bestMatch = scriptMatch;
        highestConfidence = scriptMatch.confidence;
      }

      // Confidence threshold - only return if confidence > 0.6
      if (bestMatch && highestConfidence >= 0.6) {
        return bestMatch;
      }

      return null;
      
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
    
    if (scenarioId) {
      filter.scenario_id = scenarioId;
    }

    const subScripts = await this.subScriptModel
      .find(filter)
      .sort({ priority: -1 })
      .exec();

    for (const subScript of subScripts) {
      const confidence = this.calculateKeywordConfidence(messageText, subScript.trigger_keywords, subScript.match_mode);
      
      if (confidence > 0) {
        return {
          subScript,
          response: subScript.response_template,
          confidence,
          processedBy: 'script'
        };
      }
    }

    return null;
  }

  /**
   * Find matching main script
   */
  private async findScriptMatch(messageText: string, scriptGroupId?: string): Promise<ChatBotMatch | null> {
    const filter: any = { status: 'active' };
    
    if (scriptGroupId) {
      filter.scriptGroupId = scriptGroupId;
    }

    const scripts = await this.scriptModel
      .find(filter)
      .sort({ priority: -1 })
      .exec();

    for (const script of scripts) {
      const confidence = this.calculateKeywordConfidence(messageText, script.trigger, 'contains');
      
      if (confidence > 0) {
        return {
          script,
          response: script.responseTemplate,
          confidence,
          processedBy: 'script'
        };
      }
    }

    return null;
  }

  /**
   * Calculate confidence score for keyword matching
   */
  private calculateKeywordConfidence(messageText: string, keywords: string[], matchMode: string = 'contains'): number {
    if (!keywords || keywords.length === 0) return 0;

    const text = messageText.toLowerCase();
    let matches = 0;
    let totalWords = keywords.length;

    for (const keyword of keywords) {
      const kw = keyword.toLowerCase().trim();
      if (!kw) continue;

      let isMatch = false;
      
      switch (matchMode) {
        case 'exact':
          isMatch = text === kw;
          break;
        case 'startswith':
          isMatch = text.startsWith(kw);
          break;
        case 'regex':
          try {
            const regex = new RegExp(kw, 'i');
            isMatch = regex.test(text);
          } catch (e) {
            // Fallback to contains if regex is invalid
            isMatch = text.includes(kw);
          }
          break;
        case 'contains':
        default:
          isMatch = text.includes(kw);
          break;
      }

      if (isMatch) {
        matches++;
        // Boost confidence for exact matches
        if (matchMode === 'exact' && text === kw) {
          return 1.0;
        }
      }
    }

    // Calculate confidence based on match ratio
    const confidence = matches / totalWords;
    
    // Boost confidence if multiple keywords match
    if (matches > 1) {
      return Math.min(confidence * 1.2, 1.0);
    }
    
    return confidence;
  }

  /**
   * Generate personalized response with variable substitution
   */
  private async generateResponse(match: ChatBotMatch, psid: string, pageId: string): Promise<string> {
    let response = match.response;

    try {
      // Get customer info for personalization
      const customer = await this.customersService.findByFacebookId(psid, pageId);
      
      if (customer) {
        // Replace variables with customer data
        response = response.replace(/\{\{name\}\}/g, customer.name || 'Bạn');
        response = response.replace(/\{\{phone\}\}/g, customer.phone || '');
        response = response.replace(/\{\{email\}\}/g, customer.email || '');
      } else {
        // Default replacements
        response = response.replace(/\{\{name\}\}/g, 'Bạn');
        response = response.replace(/\{\{phone\}\}/g, '');
        response = response.replace(/\{\{email\}\}/g, '');
      }

      // Add timestamp variables
      const now = new Date();
      response = response.replace(/\{\{time\}\}/g, now.toLocaleTimeString('vi-VN'));
      response = response.replace(/\{\{date\}\}/g, now.toLocaleDateString('vi-VN'));

      return response;
      
    } catch (error) {
      this.logger.error(`Error generating response: ${error.message}`);
      return match.response; // Return original if error
    }
  }



  /**
   * Execute script actions (tags, variables, webhooks)
   */
  private async executeScriptActions(match: ChatBotMatch, psid: string, pageId: string): Promise<void> {
    try {
      const action = match.subScript?.action || match.script?.action;
      if (!action || action.type === 'none') return;

      switch (action.type) {
        case 'add_tag':
          if (action.tag_name) {
            await this.customersService.updateFromScript(psid, pageId, {
              tags: [action.tag_name]
            });
            this.logger.log(`Added tag "${action.tag_name}" to customer ${psid}`);
          }
          break;

        case 'set_variable':
          if (action.key && action.value) {
            // Store custom variable (could extend customer schema for this)
            this.logger.log(`Set variable ${action.key}=${action.value} for customer ${psid}`);
          }
          break;

        case 'call_webhook':
          if (action.webhook_url) {
            await this.callWebhook(action.webhook_url, { psid, pageId, action });
            this.logger.log(`Called webhook: ${action.webhook_url}`);
          }
          break;
      }
      
    } catch (error) {
      this.logger.error(`Error executing script action: ${error.message}`);
    }
  }

  /**
   * Call external webhook
   */
  private async callWebhook(url: string, data: any): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        this.logger.warn(`Webhook call failed: ${response.status} ${response.statusText}`);
      }
      
    } catch (error) {
      this.logger.error(`Webhook call error: ${error.message}`);
    }
  }

  /**
   * Update message quota for fanpage
   */
  private async updateMessageQuota(pageId: string): Promise<void> {
    try {
      await this.fanpageModel.updateOne(
        { pageId },
        { $inc: { messagesSentThisMonth: 1 } }
      ).exec();
    } catch (error) {
      this.logger.error(`Error updating message quota: ${error.message}`);
    }
  }

  /**
   * Process message using OpenAI when no script matches
   */
  private async processWithOpenAI(
    messageText: string,
    pageId: string,
    psid: string,
    conversationId: string,
    fanpage: any
  ): Promise<boolean> {
    try {
      this.logger.log(`Processing with OpenAI for pageId=${pageId}, psid=${psid}`);

      // 1. Find appropriate OpenAI configuration 
      let openaiConfig = null;
      
      // Try to get config by fanpage first
      if (fanpage._id) {
        openaiConfig = await this.openaiConfigService.findByFanpage(fanpage._id.toString());
      }
      
      // If no fanpage-specific config, try by scenario
      if (!openaiConfig && fanpage.defaultScriptGroupId) {
        openaiConfig = await this.openaiConfigService.findByScenario(fanpage.defaultScriptGroupId.toString());
      }
      
      // If still no config, use default
      if (!openaiConfig) {
        openaiConfig = await this.openaiConfigService.findDefault();
      }

      if (!openaiConfig) {
        this.logger.warn(`No OpenAI configuration found for pageId=${pageId}`);
        return false;
      }

      this.logger.log(`Using OpenAI config: ${openaiConfig.name} (${openaiConfig.model})`);

      // 2. Get customer info for personalization
      const customer = await this.customersService.findByFacebookId(psid, pageId);

      // 3. Get recent conversation history
      const conversationHistory = await this.getConversationHistory(conversationId);

      // 4. Prepare OpenAI request with config-specific settings
      const openaiRequest = {
        message: messageText,
        customerName: customer?.name || 'bạn',
        fanpageName: fanpage.pageName || 'shop',
        conversationHistory,
        businessContext: {
          fanpageCategories: fanpage.categories,
          timeZone: fanpage.timeZone,
        },
        // Pass configuration for AI service
        config: {
          model: openaiConfig.model,
          apiKey: openaiConfig.apiKey,
          systemPrompt: openaiConfig.systemPrompt,
          maxTokens: openaiConfig.maxTokens,
          temperature: openaiConfig.temperature,
        }
      };

      // 5. Generate AI response using config
      const aiResponse = await this.openaiService.generateChatResponseWithConfig(openaiRequest);

      if (!aiResponse.success || !aiResponse.response) {
        this.logger.warn(`OpenAI failed: ${aiResponse.error}`);
        
        // Update failure stats
        await this.openaiConfigService.updateUsageStats(
          openaiConfig._id.toString(), 
          aiResponse.tokensUsed || 0, 
          false
        );
        
        return false; // Fallback to agent
      }

      // 6. Send AI response
      const success = await this.sendBotResponse(pageId, psid, aiResponse.response, conversationId, 'ai');

      if (success) {
        this.logger.log(`AI response sent successfully. Config: ${openaiConfig.name}, Tokens used: ${aiResponse.tokensUsed}`);
        
        // Update success stats
        await this.openaiConfigService.updateUsageStats(
          openaiConfig._id.toString(), 
          aiResponse.tokensUsed || 0, 
          true
        );
        
        return true;
      }

      return false;

    } catch (error) {
      this.logger.error(`OpenAI processing failed: ${error.message}`, error);
      return false;
    }
  }

  /**
   * Get recent conversation history for AI context
   */
  private async getConversationHistory(conversationId: string): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    try {
      const messages = await this.messagesService.findByConversationId(conversationId, {
        limit: 10,
        order: 'desc'
      });

      // Convert to OpenAI format and reverse to chronological order
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
   * Enhanced sendBotResponse to support AI responses
   */
  private async sendBotResponse(
    pageId: string, 
    psid: string, 
    responseText: string,
    conversationId: string,
    processedBy: 'script' | 'ai' = 'script'
  ): Promise<boolean> {
    try {
      // 1. Get fanpage access token
      const fanpage = await this.fanpageModel.findOne({ pageId }).exec();
      if (!fanpage || !fanpage.accessToken) {
        this.logger.error(`No access token found for fanpage: ${pageId}`);
        return false;
      }

      // 2. Send typing indicator first
      await this.facebookSendService.sendTypingOn(fanpage.accessToken, psid);
      
      // Small delay for natural feel
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Send actual message
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

      // 5. Save bot message to database
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
}