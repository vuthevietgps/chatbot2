import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { WebhookLog, WebhookLogDocument } from './schemas/webhook-log.schema';
import { CreateWebhookLogDto } from './dto/create-webhook-log.dto';
import { UpdateWebhookLogDto } from './dto/update-webhook-log.dto';

@Injectable()
export class WebhookLogsService {
  constructor(
    @InjectModel(WebhookLog.name) 
    private webhookLogModel: Model<WebhookLogDocument>,
  ) {}

  async create(dto: CreateWebhookLogDto): Promise<WebhookLog> {
    const id = dto.id || randomUUID();
    const payload = {
      ...dto,
      id,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
      verified: dto.verified || false,
    };

    const created = new this.webhookLogModel(payload);
    return await created.save();
  }

  async findAll(): Promise<WebhookLog[]> {
    return this.webhookLogModel
      .find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findByPageId(pageId: string): Promise<WebhookLog[]> {
    return this.webhookLogModel
      .find({ pageId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async findOne(id: string): Promise<WebhookLog> {
    const log = await this.webhookLogModel
      .findOne({ id })
      .lean()
      .exec();
    
    if (!log) {
      throw new NotFoundException('Không tìm thấy webhook log');
    }
    return log;
  }

  async update(id: string, dto: UpdateWebhookLogDto): Promise<WebhookLog> {
    const payload = {
      ...dto,
      ...(dto.createdAt && { createdAt: new Date(dto.createdAt) }),
    };

    const updated = await this.webhookLogModel
      .findOneAndUpdate({ id }, payload, { new: true })
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy webhook log');
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.webhookLogModel.deleteOne({ id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Không tìm thấy webhook log');
    }
  }
}