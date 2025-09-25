import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OpenAIConfig, OpenAIConfigDocument } from './schemas/openai-config.schema';
import { CreateOpenAIConfigDto } from './dto/create-openai-config.dto';
import { UpdateOpenAIConfigDto } from './dto/update-openai-config.dto';
import OpenAI from 'openai';

export interface OpenAIConfigQuery {
  search?: string;
  status?: 'active' | 'inactive';
  scenario?: string;
  fanpage?: string;
  page?: number;
  limit?: number;
}

export interface OpenAIConfigResponse {
  data: OpenAIConfig[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable()
export class OpenAIConfigService {
  private readonly logger = new Logger(OpenAIConfigService.name);

  constructor(
    @InjectModel(OpenAIConfig.name) private configModel: Model<OpenAIConfigDocument>,
  ) {}

  async create(createDto: CreateOpenAIConfigDto): Promise<OpenAIConfig> {
    try {
      // Validate API key by testing connection
      if (!await this.validateApiKey(createDto.apiKey, createDto.model)) {
        throw new BadRequestException('API Key không hợp lệ hoặc không có quyền truy cập model này');
      }

      // Convert string IDs to ObjectIds
      const payload = {
        ...createDto,
        applicableScenarios: createDto.applicableScenarios?.map(id => new Types.ObjectId(id)) || [],
        applicableFanpages: createDto.applicableFanpages?.map(id => new Types.ObjectId(id)) || [],
        createdBy: createDto.createdBy ? new Types.ObjectId(createDto.createdBy) : undefined,
      };

      // If this is set as default, unset other defaults
      if (payload.isDefault) {
        await this.configModel.updateMany(
          { isDefault: true },
          { isDefault: false }
        ).exec();
      }

      const config = new this.configModel(payload);
      const saved = await config.save();

      this.logger.log(`OpenAI config created: ${saved.name}`);
      return saved;

    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('Tên cấu hình đã tồn tại');
      }
      throw error;
    }
  }

  async findAll(query: OpenAIConfigQuery = {}): Promise<OpenAIConfigResponse> {
    const {
      search,
      status,
      scenario,
      fanpage,
      page = 1,
      limit = 20
    } = query;

    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (scenario) {
      filter.applicableScenarios = new Types.ObjectId(scenario);
    }

    if (fanpage) {
      filter.applicableFanpages = new Types.ObjectId(fanpage);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.configModel
        .find(filter)
        .populate('applicableScenarios', 'name description')
        .populate('applicableFanpages', 'pageName pageId')
        .populate('createdBy', 'fullName email')
        .populate('updatedBy', 'fullName email')
        .sort({ isDefault: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.configModel.countDocuments(filter).exec()
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: string): Promise<OpenAIConfig> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    const config = await this.configModel
      .findById(id)
      .populate('applicableScenarios', 'name description')
      .populate('applicableFanpages', 'pageName pageId')
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email')
      .lean()
      .exec();

    if (!config) {
      throw new NotFoundException('Không tìm thấy cấu hình OpenAI');
    }

    return config;
  }

  async findDefault(): Promise<OpenAIConfig | null> {
    return await this.configModel
      .findOne({ status: 'active', isDefault: true })
      .lean()
      .exec();
  }

  async findByScenario(scenarioId: string): Promise<OpenAIConfig | null> {
    return await this.configModel
      .findOne({
        status: 'active',
        applicableScenarios: new Types.ObjectId(scenarioId)
      })
      .lean()
      .exec();
  }

  async findByFanpage(fanpageId: string): Promise<OpenAIConfig | null> {
    return await this.configModel
      .findOne({
        status: 'active',
        applicableFanpages: new Types.ObjectId(fanpageId)
      })
      .lean()
      .exec();
  }

  async update(id: string, updateDto: UpdateOpenAIConfigDto): Promise<OpenAIConfig> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    // Validate API key if changed
    if (updateDto.apiKey || updateDto.model) {
      const current = await this.configModel.findById(id).exec();
      if (!current) {
        throw new NotFoundException('Không tìm thấy cấu hình OpenAI');
      }

      const keyToTest = updateDto.apiKey || current.apiKey;
      const modelToTest = updateDto.model || current.model;

      if (!await this.validateApiKey(keyToTest, modelToTest)) {
        throw new BadRequestException('API Key không hợp lệ hoặc không có quyền truy cập model này');
      }
    }

    const payload = {
      ...updateDto,
      applicableScenarios: updateDto.applicableScenarios?.map(id => new Types.ObjectId(id)),
      applicableFanpages: updateDto.applicableFanpages?.map(id => new Types.ObjectId(id)),
      updatedBy: updateDto.updatedBy ? new Types.ObjectId(updateDto.updatedBy) : undefined,
    };

    // If this is set as default, unset other defaults
    if (payload.isDefault) {
      await this.configModel.updateMany(
        { _id: { $ne: id }, isDefault: true },
        { isDefault: false }
      ).exec();
    }

    const updated = await this.configModel
      .findByIdAndUpdate(id, payload, { new: true })
      .populate('applicableScenarios', 'name description')
      .populate('applicableFanpages', 'pageName pageId')
      .populate('createdBy', 'fullName email')
      .populate('updatedBy', 'fullName email')
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy cấu hình OpenAI');
    }

    this.logger.log(`OpenAI config updated: ${updated.name}`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    const config = await this.configModel.findById(id).exec();
    if (!config) {
      throw new NotFoundException('Không tìm thấy cấu hình OpenAI');
    }

    if (config.isDefault) {
      throw new BadRequestException('Không thể xóa cấu hình mặc định');
    }

    await this.configModel.findByIdAndDelete(id).exec();
    this.logger.log(`OpenAI config deleted: ${config.name}`);
  }

  async setDefault(id: string): Promise<OpenAIConfig> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID không hợp lệ');
    }

    // Unset all defaults
    await this.configModel.updateMany({}, { isDefault: false }).exec();

    // Set new default
    const updated = await this.configModel
      .findByIdAndUpdate(id, { isDefault: true }, { new: true })
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy cấu hình OpenAI');
    }

    this.logger.log(`OpenAI default config set: ${updated.name}`);
    return updated;
  }

  async testConfig(id: string): Promise<{ success: boolean; response?: string; error?: string }> {
    const config = await this.findOne(id);

    try {
      const openai = new OpenAI({ apiKey: config.apiKey });

      const completion = await openai.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: 'Xin chào, đây là tin nhắn test.' }
        ],
        max_tokens: Math.min(config.maxTokens, 100),
        temperature: config.temperature,
      });

      const response = completion.choices[0]?.message?.content;

      if (response) {
        return { success: true, response: response.trim() };
      } else {
        return { success: false, error: 'Không nhận được phản hồi từ OpenAI' };
      }

    } catch (error) {
      this.logger.error(`OpenAI config test failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async updateUsageStats(
    id: string, 
    tokensUsed: number, 
    success: boolean
  ): Promise<void> {
    try {
      const updateData: any = {
        $inc: {
          totalRequests: 1,
          totalTokensUsed: tokensUsed,
        },
        lastUsedAt: new Date(),
      };

      if (success) {
        updateData.$inc.successfulResponses = 1;
      } else {
        updateData.$inc.failedResponses = 1;
      }

      await this.configModel.findByIdAndUpdate(id, updateData).exec();

    } catch (error) {
      this.logger.error(`Error updating usage stats: ${error.message}`);
    }
  }

  private async validateApiKey(apiKey: string, model: string): Promise<boolean> {
    try {
      const openai = new OpenAI({ apiKey });
      
      const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      });

      return !!completion.choices[0]?.message?.content;

    } catch (error) {
      this.logger.warn(`API Key validation failed: ${error.message}`);
      return false;
    }
  }
}