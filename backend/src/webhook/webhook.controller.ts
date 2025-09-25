import { Controller, Post, Get, Body, Headers, Query, Logger, BadRequestException } from '@nestjs/common';
import { WebhookProcessorService } from './webhook-processor.service';
import * as crypto from 'crypto';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  
  constructor(private webhookProcessorService: WebhookProcessorService) {}

  // Facebook webhook verification
  @Get('facebook')
  verifyWebhook(@Query() query: any) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    // Verify token (should match environment variable)
    const verifyToken = process.env.FACEBOOK_VERIFY_TOKEN || 'your-verify-token';
    
    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Webhook verified successfully');
      return challenge;
    } else {
      this.logger.error('Webhook verification failed');
      throw new BadRequestException('Webhook verification failed');
    }
  }

  // Facebook webhook event handler
  @Post('facebook')
  async handleWebhook(@Body() body: any, @Headers() headers: any) {
    try {
      // Verify signature (optional but recommended for production)
      const signature = headers['x-hub-signature-256'];
      if (signature) {
        const isValid = this.verifySignature(body, signature);
        if (!isValid) {
          this.logger.error('Invalid webhook signature');
          throw new BadRequestException('Invalid signature');
        }
      }

      // Process webhook payload
      if (body.object === 'page') {
        // Extract page ID from the first entry
        const pageId = body.entry?.[0]?.id;
        
        if (pageId) {
          await this.webhookProcessorService.processWebhookPayload(pageId, body, headers);
          this.logger.log(`Webhook processed for page: ${pageId}`);
        } else {
          this.logger.warn('No page ID found in webhook payload');
        }
      }

      return { status: 'OK' };
    } catch (error) {
      this.logger.error('Webhook processing failed', error);
      throw error;
    }
  }

  private verifySignature(payload: any, signature: string): boolean {
    try {
      const appSecret = process.env.FACEBOOK_APP_SECRET;
      if (!appSecret) {
        this.logger.warn('Facebook App Secret not configured');
        return true; // Skip verification if not configured
      }

      const expectedSignature = crypto
        .createHmac('sha256', appSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      const actualSignature = signature.replace('sha256=', '');
      
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(actualSignature, 'hex')
      );
    } catch (error) {
      this.logger.error('Signature verification error', error);
      return false;
    }
  }
}