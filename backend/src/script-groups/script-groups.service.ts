import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ScriptGroup, ScriptGroupDocument } from './schemas/script-group.schema';
import { CreateScriptGroupDto } from './dto/create-script-group.dto';
import { UpdateScriptGroupDto } from './dto/update-script-group.dto';

@Injectable()
export class ScriptGroupsService {
  constructor(@InjectModel(ScriptGroup.name) private model: Model<ScriptGroupDocument>) {}

  async create(dto: CreateScriptGroupDto) {
    try {
      const payload: any = {
        ...dto,
        pageId: new Types.ObjectId(dto.pageId),
        productGroupId: new Types.ObjectId(dto.productGroupId),
        createdBy: dto.createdBy ? new Types.ObjectId(dto.createdBy) : undefined,
      };
      const doc = new this.model(payload);
      return await doc.save();
    } catch (e: any) {
      if (e?.code === 11000) throw new BadRequestException('Script group with this page and name already exists');
      throw e;
    }
  }

  async findAll() {
    return this.model
      .find()
      .populate('pageId', 'pageName pageId')
      .populate('productGroupId', 'name color')
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();
  }

  async findOne(id: string) {
    const doc = await this.model
      .findById(id)
      .populate('pageId', 'pageName pageId')
      .populate('productGroupId', 'name color')
      .populate('createdBy', 'fullName email')
      .lean();
    if (!doc) throw new NotFoundException('Script group not found');
    return doc;
  }

  async update(id: string, dto: UpdateScriptGroupDto) {
    const payload: any = { ...dto };
    if (dto.pageId) payload.pageId = new Types.ObjectId(dto.pageId);
    if (dto.productGroupId) payload.productGroupId = new Types.ObjectId(dto.productGroupId);
    if (dto.createdBy) payload.createdBy = new Types.ObjectId(dto.createdBy);

    try {
      const updated = await this.model.findByIdAndUpdate(id, payload, { new: true }).lean();
      if (!updated) throw new NotFoundException('Script group not found');
      return updated;
    } catch (e: any) {
      if (e?.code === 11000) throw new BadRequestException('Script group with this page and name already exists');
      throw e;
    }
  }

  async remove(id: string) {
    const res = await this.model.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Script group not found');
  }
}
