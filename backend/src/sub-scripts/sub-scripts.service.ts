import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SubScript, SubScriptDocument } from './schemas/sub-script.schema';
import { CreateSubScriptDto } from './dto/create-sub-script.dto';
import { UpdateSubScriptDto } from './dto/update-sub-script.dto';

@Injectable()
export class SubScriptsService {
  constructor(
    @InjectModel(SubScript.name) private subScriptModel: Model<SubScriptDocument>,
  ) {}

  async create(createSubScriptDto: CreateSubScriptDto): Promise<SubScript> {
    try {
      const subScript = new this.subScriptModel({
        ...createSubScriptDto,
        scenario_id: new Types.ObjectId(createSubScriptDto.scenario_id),
        product_id: createSubScriptDto.product_id ? new Types.ObjectId(createSubScriptDto.product_id) : null,
        product_group_id: createSubScriptDto.product_group_id ? new Types.ObjectId(createSubScriptDto.product_group_id) : null,
        created_by: new Types.ObjectId(createSubScriptDto.created_by),
        created_at: new Date(),
        updated_at: new Date(),
      });
      
      return await subScript.save();
    } catch (error) {
      throw new BadRequestException(`Failed to create sub-script: ${error.message}`);
    }
  }

  async findAll(query?: any): Promise<SubScript[]> {
    const filter = {};
    
    if (query?.scenario_id) {
      filter['scenario_id'] = new Types.ObjectId(query.scenario_id);
    }
    
    if (query?.status) {
      filter['status'] = query.status;
    }

    return await this.subScriptModel
      .find(filter)
      .populate('scenario_id', 'name')
      .populate('product_id', 'name')
      .populate('product_group_id', 'name')
      .populate('created_by', 'name email')
      .sort({ priority: -1, created_at: -1 })
      .exec();
  }

  async findOne(id: string): Promise<SubScript> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid sub-script ID format');
    }

    const subScript = await this.subScriptModel
      .findById(id)
      .populate('scenario_id', 'name')
      .populate('product_id', 'name')
      .populate('product_group_id', 'name')
      .populate('created_by', 'name email')
      .exec();

    if (!subScript) {
      throw new NotFoundException(`Sub-script with ID ${id} not found`);
    }

    return subScript;
  }

  async findByScenario(scenarioId: string): Promise<SubScript[]> {
    if (!Types.ObjectId.isValid(scenarioId)) {
      throw new BadRequestException('Invalid scenario ID format');
    }

    return await this.subScriptModel
      .find({ 
        scenario_id: new Types.ObjectId(scenarioId),
        status: 'active'
      })
      .populate('product_id', 'name')
      .populate('product_group_id', 'name')
      .sort({ priority: -1, created_at: -1 })
      .exec();
  }

  async findByKeywords(keywords: string[], scenarioId?: string): Promise<SubScript[]> {
    const filter: any = {
      status: 'active',
      trigger_keywords: { $in: keywords.map(k => new RegExp(k, 'i')) }
    };

    if (scenarioId && Types.ObjectId.isValid(scenarioId)) {
      filter.scenario_id = new Types.ObjectId(scenarioId);
    }

    return await this.subScriptModel
      .find(filter)
      .populate('product_id', 'name')
      .populate('product_group_id', 'name')
      .sort({ priority: -1 })
      .exec();
  }

  async update(id: string, updateSubScriptDto: UpdateSubScriptDto): Promise<SubScript> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid sub-script ID format');
    }

    const updateData: any = {
      ...updateSubScriptDto,
      updated_at: new Date(),
    };

    if (updateSubScriptDto.scenario_id) {
      updateData.scenario_id = new Types.ObjectId(updateSubScriptDto.scenario_id);
    }

    if (updateSubScriptDto.product_id) {
      updateData.product_id = new Types.ObjectId(updateSubScriptDto.product_id);
    }

    if (updateSubScriptDto.product_group_id) {
      updateData.product_group_id = new Types.ObjectId(updateSubScriptDto.product_group_id);
    }

    const updatedSubScript = await this.subScriptModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('scenario_id', 'name')
      .populate('product_id', 'name')
      .populate('product_group_id', 'name')
      .populate('created_by', 'name email')
      .exec();

    if (!updatedSubScript) {
      throw new NotFoundException(`Sub-script with ID ${id} not found`);
    }

    return updatedSubScript;
  }

  async toggleStatus(id: string): Promise<SubScript> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid sub-script ID format');
    }

    const subScript = await this.subScriptModel.findById(id);
    if (!subScript) {
      throw new NotFoundException(`Sub-script with ID ${id} not found`);
    }

    const newStatus = subScript.status === 'active' ? 'inactive' : 'active';
    
    return await this.subScriptModel
      .findByIdAndUpdate(
        id, 
        { status: newStatus, updated_at: new Date() }, 
        { new: true }
      )
      .populate('scenario_id', 'name')
      .populate('product_id', 'name')
      .populate('product_group_id', 'name')
      .populate('created_by', 'name email')
      .exec();
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid sub-script ID format');
    }

    const result = await this.subScriptModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException(`Sub-script with ID ${id} not found`);
    }
  }

  async getStatistics(): Promise<any> {
    const totalSubScripts = await this.subScriptModel.countDocuments();
    const activeSubScripts = await this.subScriptModel.countDocuments({ status: 'active' });
    const inactiveSubScripts = await this.subScriptModel.countDocuments({ status: 'inactive' });

    const byScenario = await this.subScriptModel.aggregate([
      {
        $group: {
          _id: '$scenario_id',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'script_groups',
          localField: '_id',
          foreignField: '_id',
          as: 'scenario'
        }
      },
      {
        $project: {
          scenarioName: { $arrayElemAt: ['$scenario.name', 0] },
          count: 1
        }
      }
    ]);

    return {
      total: totalSubScripts,
      active: activeSubScripts,
      inactive: inactiveSubScripts,
      byScenario
    };
  }
}