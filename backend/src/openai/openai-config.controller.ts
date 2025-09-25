import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { OpenAIConfigService, OpenAIConfigQuery } from './openai-config.service';
import { CreateOpenAIConfigDto } from './dto/create-openai-config.dto';
import { UpdateOpenAIConfigDto } from './dto/update-openai-config.dto';
import { UserRole } from '../users/schemas/user.schema';

@ApiTags('OpenAI Config')
@Controller('openai-config')
export class OpenAIConfigController {
  private readonly logger = new Logger(OpenAIConfigController.name);

  constructor(private readonly configService: OpenAIConfigService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo cấu hình OpenAI mới' })
  @ApiResponse({ status: 201, description: 'Cấu hình đã được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  async create(@Body() createDto: CreateOpenAIConfigDto) {
    this.logger.log(`Creating OpenAI config: ${createDto.name}`);
    return await this.configService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách cấu hình OpenAI' })
  @ApiQuery({ name: 'search', required: false, description: 'Tìm kiếm theo tên hoặc mô tả' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'], description: 'Lọc theo trạng thái' })
  @ApiQuery({ name: 'scenario', required: false, description: 'Lọc theo kịch bản' })
  @ApiQuery({ name: 'fanpage', required: false, description: 'Lọc theo fanpage' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Trang hiện tại' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng mỗi trang' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  async findAll(@Query() query: OpenAIConfigQuery) {
    return await this.configService.findAll(query);
  }

  @Get('models')
  @ApiOperation({ summary: 'Lấy danh sách model OpenAI có sẵn' })
  @ApiResponse({ status: 200, description: 'Danh sách model' })
  getAvailableModels() {
    return {
      data: [
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          description: 'Nhanh và tiết kiệm chi phí, phù hợp cho hầu hết tác vụ',
          maxTokens: 4096,
          costPer1kTokens: 0.0015
        },
        {
          id: 'gpt-4',
          name: 'GPT-4',
          description: 'Chất lượng cao nhất, phù hợp cho tác vụ phức tạp',
          maxTokens: 8192,
          costPer1kTokens: 0.03
        },
        {
          id: 'gpt-4-turbo',
          name: 'GPT-4 Turbo',
          description: 'Cân bằng giữa chất lượng và tốc độ',
          maxTokens: 128000,
          costPer1kTokens: 0.01
        },
        {
          id: 'gpt-4o',
          name: 'GPT-4 Omni',
          description: 'Model mới nhất với khả năng đa phương tiện',
          maxTokens: 128000,
          costPer1kTokens: 0.005
        }
      ]
    };
  }

  @Get('default')
  @ApiOperation({ summary: 'Lấy cấu hình mặc định' })
  @ApiResponse({ status: 200, description: 'Cấu hình mặc định' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cấu hình mặc định' })
  async getDefault() {
    const config = await this.configService.findDefault();
    if (!config) {
      return { data: null, message: 'Chưa có cấu hình mặc định' };
    }
    return { data: config };
  }

  @Get('scenario/:scenarioId')
  @ApiOperation({ summary: 'Lấy cấu hình theo kịch bản' })
  @ApiResponse({ status: 200, description: 'Cấu hình cho kịch bản' })
  async getByScenario(@Param('scenarioId') scenarioId: string) {
    const config = await this.configService.findByScenario(scenarioId);
    return { data: config };
  }

  @Get('fanpage/:fanpageId')
  @ApiOperation({ summary: 'Lấy cấu hình theo fanpage' })
  @ApiResponse({ status: 200, description: 'Cấu hình cho fanpage' })
  async getByFanpage(@Param('fanpageId') fanpageId: string) {
    const config = await this.configService.findByFanpage(fanpageId);
    return { data: config };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết cấu hình OpenAI' })
  @ApiResponse({ status: 200, description: 'Thông tin cấu hình' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cấu hình' })
  async findOne(@Param('id') id: string) {
    return await this.configService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật cấu hình OpenAI' })
  @ApiResponse({ status: 200, description: 'Cấu hình đã được cập nhật' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cấu hình' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateOpenAIConfigDto) {
    this.logger.log(`Updating OpenAI config: ${id}`);
    return await this.configService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa cấu hình OpenAI' })
  @ApiResponse({ status: 204, description: 'Cấu hình đã được xóa' })
  @ApiResponse({ status: 400, description: 'Không thể xóa cấu hình mặc định' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cấu hình' })
  async remove(@Param('id') id: string) {
    this.logger.log(`Deleting OpenAI config: ${id}`);
    await this.configService.remove(id);
  }

  @Post(':id/set-default')
  @ApiOperation({ summary: 'Đặt làm cấu hình mặc định' })
  @ApiResponse({ status: 200, description: 'Đã đặt làm cấu hình mặc định' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cấu hình' })
  async setDefault(@Param('id') id: string) {
    this.logger.log(`Setting default OpenAI config: ${id}`);
    return await this.configService.setDefault(id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test cấu hình OpenAI' })
  @ApiResponse({ status: 200, description: 'Kết quả test' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cấu hình' })
  async testConfig(@Param('id') id: string) {
    this.logger.log(`Testing OpenAI config: ${id}`);
    return await this.configService.testConfig(id);
  }

  @Get(':id/usage-stats')
  @ApiOperation({ summary: 'Lấy thống kê sử dụng' })
  @ApiResponse({ status: 200, description: 'Thống kê sử dụng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cấu hình' })
  async getUsageStats(@Param('id') id: string) {
    const config = await this.configService.findOne(id);
    
    const successRate = config.totalRequests > 0 
      ? ((config.successfulResponses || 0) / config.totalRequests * 100).toFixed(2)
      : '0.00';

    const avgTokensPerRequest = config.totalRequests > 0
      ? Math.round((config.totalTokensUsed || 0) / config.totalRequests)
      : 0;

    return {
      data: {
        totalRequests: config.totalRequests || 0,
        successfulResponses: config.successfulResponses || 0,
        failedResponses: config.failedResponses || 0,
        totalTokensUsed: config.totalTokensUsed || 0,
        successRate: `${successRate}%`,
        avgTokensPerRequest,
        lastUsedAt: config.lastUsedAt,
      }
    };
  }
}