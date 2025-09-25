import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Script, ScriptDocument } from './schemas/script.schema';
import { CreateScriptDto } from './dto/create-script.dto';
import { UpdateScriptDto } from './dto/update-script.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ScriptsService {
  constructor(@InjectModel(Script.name) private model: Model<ScriptDocument>) {}

  async create(dto: CreateScriptDto) {
    try {
      const payload: any = {
        ...dto,
        id: dto.id || randomUUID(),
        scriptGroupId: new Types.ObjectId(dto.scriptGroupId),
        linkedProductId: dto.linkedProductId ? new Types.ObjectId(dto.linkedProductId) : undefined,
        linkedProductGroupId: dto.linkedProductGroupId ? new Types.ObjectId(dto.linkedProductGroupId) : undefined,
      };
      const doc = new this.model(payload);
      return await doc.save();
    } catch (e: any) {
      if (e?.code === 11000) throw new BadRequestException('Script already exists (duplicate)');
      throw e;
    }
  }

  async findAll() {
    return this.model
      .find()
      .populate('scriptGroupId', 'name')
      .populate('linkedProductId', 'name price')
      .populate('linkedProductGroupId', 'name')
      .sort({ createdAt: -1 })
      .lean();
  }

  async findOne(id: string) {
    const doc = await this.model
      .findById(id)
      .populate('scriptGroupId', 'name')
      .populate('linkedProductId', 'name price')
      .populate('linkedProductGroupId', 'name')
      .lean();
    if (!doc) throw new NotFoundException('Script not found');
    return doc;
  }

  async update(id: string, dto: UpdateScriptDto) {
    const payload: any = { ...dto };
    if (dto.scriptGroupId) payload.scriptGroupId = new Types.ObjectId(dto.scriptGroupId);
    if (dto.linkedProductId) payload.linkedProductId = new Types.ObjectId(dto.linkedProductId);
    if (dto.linkedProductGroupId) payload.linkedProductGroupId = new Types.ObjectId(dto.linkedProductGroupId);
    try {
      const updated = await this.model.findByIdAndUpdate(id, payload, { new: true }).lean();
      if (!updated) throw new NotFoundException('Script not found');
      return updated;
    } catch (e: any) {
      if (e?.code === 11000) throw new BadRequestException('Script already exists (duplicate)');
      throw e;
    }
  }

  async remove(id: string) {
    const res = await this.model.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Script not found');
  }
}
