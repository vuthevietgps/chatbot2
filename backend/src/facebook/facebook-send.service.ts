import { Injectable, Logger } from '@nestjs/common';

export interface FacebookSendOptions {
  pageAccessToken: string;
  recipientPsid: string;
  text: string;
  attachments?: any[];
}

export interface FacebookSendResponse {
  success: boolean;
  fbMessageId?: string;
  error?: string;
}

@Injectable()
export class FacebookSendService {
  private readonly logger = new Logger(FacebookSendService.name);
  private readonly FACEBOOK_API_URL = 'https://graph.facebook.com/v18.0/me/messages';

  async sendMessage(options: FacebookSendOptions): Promise<FacebookSendResponse> {
    try {
      const { pageAccessToken, recipientPsid, text, attachments = [] } = options;

      // Build message payload
      const messageData: any = {
        recipient: { id: recipientPsid },
        message: { text },
      };

      // Add attachments if any
      if (attachments.length > 0) {
        messageData.message.attachments = attachments;
      }

      // Send to Facebook Graph API
      const response = await fetch(this.FACEBOOK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pageAccessToken}`,
        },
        body: JSON.stringify(messageData),
      });

      const result = await response.json();

      if (response.ok && result.message_id) {
        this.logger.log(`Message sent successfully to ${recipientPsid}, FB ID: ${result.message_id}`);
        return {
          success: true,
          fbMessageId: result.message_id,
        };
      } else {
        this.logger.error(`Failed to send message to ${recipientPsid}:`, result);
        return {
          success: false,
          error: result.error?.message || 'Unknown Facebook API error',
        };
      }
    } catch (error) {
      this.logger.error(`Facebook Send API error:`, error);
      return {
        success: false,
        error: error.message || 'Network or API error',
      };
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingOn(pageAccessToken: string, recipientPsid: string): Promise<boolean> {
    try {
      const response = await fetch(this.FACEBOOK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pageAccessToken}`,
        },
        body: JSON.stringify({
          recipient: { id: recipientPsid },
          sender_action: 'typing_on',
        }),
      });

      return response.ok;
    } catch (error) {
      this.logger.error('Failed to send typing indicator:', error);
      return false;
    }
  }

  /**
   * Stop typing indicator
   */
  async sendTypingOff(pageAccessToken: string, recipientPsid: string): Promise<boolean> {
    try {
      const response = await fetch(this.FACEBOOK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pageAccessToken}`,
        },
        body: JSON.stringify({
          recipient: { id: recipientPsid },
          sender_action: 'typing_off',
        }),
      });

      return response.ok;
    } catch (error) {
      this.logger.error('Failed to stop typing indicator:', error);
      return false;
    }
  }
}