import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Fanpage, FanpageDocument } from './schemas/fanpage.schema';
import { CreateFanpageDto } from './dto/create-fanpage.dto';
import { UpdateFanpageDto } from './dto/update-fanpage.dto';

@Injectable()
export class FanpagesService {
  constructor(@InjectModel(Fanpage.name) private model: Model<FanpageDocument>) {}

  async create(dto: CreateFanpageDto): Promise<Fanpage> {
    try {
      const toCreate: any = {
        ...dto,
        connectedAt: new Date(dto.connectedAt),
        lastRefreshed: dto.lastRefreshed ? new Date(dto.lastRefreshed) : undefined,
      };
      const created = new this.model(toCreate);
      const saved = await created.save();
      return saved;
    } catch (e: any) {
      if (e?.code === 11000) {
        throw new BadRequestException('Fanpage pageId must be unique');
      }
      throw e;
    }
  }

  async findAll(): Promise<Fanpage[]> {
    return this.model.find().populate('connectedBy', 'fullName email').lean();
  }

  async findOne(id: string): Promise<Fanpage> {
    const doc = await this.model.findById(id).populate('connectedBy', 'fullName email').lean();
    if (!doc) throw new NotFoundException('Fanpage not found');
    return doc;
  }

  async update(id: string, dto: UpdateFanpageDto): Promise<Fanpage> {
    const payload: any = { ...dto };
    if (dto.connectedAt) payload.connectedAt = new Date(dto.connectedAt);
    if (dto.lastRefreshed) payload.lastRefreshed = new Date(dto.lastRefreshed);
    try {
      const updated = await this.model.findByIdAndUpdate(id, payload, { new: true }).lean();
      if (!updated) throw new NotFoundException('Fanpage not found');
      return updated;
    } catch (e: any) {
      if (e?.code === 11000) {
        throw new BadRequestException('Fanpage pageId must be unique');
      }
      throw e;
    }
  }

  async remove(id: string): Promise<void> {
    const res = await this.model.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Fanpage not found');
  }
}
