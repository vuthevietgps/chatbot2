import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Fanpage, FanpageDocument, FanpageStatus } from '../fanpages/schemas/fanpage.schema';

@Injectable()
export class FacebookService {
  private readonly graphBase = process.env.FB_GRAPH_BASE || 'https://graph.facebook.com/v18.0';

  constructor(
    @InjectModel(Fanpage.name) private fanpageModel: Model<FanpageDocument>,
  ) {}

  private async getFanpage(pageId: string) {
    const fp = await this.fanpageModel.findOne({ pageId }).exec();
    if (!fp) throw new NotFoundException('Fanpage not found');
    if (!fp.accessToken) throw new BadRequestException('Fanpage has no access token');
    return fp;
  }

  async subscribe(pageId: string) {
    const fp = await this.getFanpage(pageId);
    const url = `${this.graphBase}/${encodeURIComponent(pageId)}/subscribed_apps`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fp.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscribed_fields: ['messages','messaging_postbacks'] }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || 'Failed to subscribe webhook';
      throw new BadRequestException(msg);
    }
    fp.webhookSubscribed = true;
    await fp.save();
    return { success: true, pageId, webhookSubscribed: true, updatedAt: new Date().toISOString() };
  }

  async unsubscribe(pageId: string) {
    const fp = await this.getFanpage(pageId);
    const url = `${this.graphBase}/${encodeURIComponent(pageId)}/subscribed_apps`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${fp.accessToken}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || 'Failed to unsubscribe webhook';
      throw new BadRequestException(msg);
    }
    fp.webhookSubscribed = false;
    await fp.save();
    return { success: true, pageId, webhookSubscribed: false };
  }

  async checkToken(pageId: string) {
    const fp = await this.getFanpage(pageId);
    const url = `${this.graphBase}/me?access_token=${encodeURIComponent(fp.accessToken)}`;
    const res = await fetch(url);
    let status: FanpageStatus = FanpageStatus.ACTIVE;
    if (!res.ok) {
      // Parse error response from Graph
      const data = await res.json().catch(() => ({}));
      const code = data?.error?.code;
      if (code === 190 || data?.error?.message?.includes('Invalid OAuth 2.0 Access Token')) {
        status = FanpageStatus.EXPIRED;
      } else {
        throw new BadRequestException(data?.error?.message || 'Token check failed');
      }
    }
    fp.status = status;
    await fp.save();
    return { pageId, status, checkedAt: new Date().toISOString() };
  }

  async refreshToken(pageId: string, newAccessToken: string) {
    const fp = await this.getFanpage(pageId);
    fp.accessToken = newAccessToken;
    fp.status = FanpageStatus.ACTIVE;
    fp.lastRefreshed = new Date();
    await fp.save();
    return { success: true, pageId, status: fp.status, lastRefreshed: fp.lastRefreshed.toISOString() };
  }
}
