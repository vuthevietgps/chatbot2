import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SubScriptsService } from './sub-scripts.service';
import { CreateSubScriptDto } from './dto/create-sub-script.dto';
import { UpdateSubScriptDto } from './dto/update-sub-script.dto';

@ApiTags('Sub-Scripts')
@Controller('sub-scripts')
export class SubScriptsController {
  constructor(private readonly subScriptsService: SubScriptsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sub-script' })
  @ApiResponse({ status: 201, description: 'Sub-script created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createSubScriptDto: CreateSubScriptDto) {
    return this.subScriptsService.create(createSubScriptDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sub-scripts' })
  @ApiResponse({ status: 200, description: 'List of sub-scripts' })
  @ApiQuery({ name: 'scenario_id', required: false, description: 'Filter by scenario ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  findAll(@Query() query: any) {
    return this.subScriptsService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get sub-scripts statistics' })
  @ApiResponse({ status: 200, description: 'Sub-scripts statistics' })
  getStatistics() {
    return this.subScriptsService.getStatistics();
  }

  @Get('by-scenario/:scenarioId')
  @ApiOperation({ summary: 'Get sub-scripts by scenario ID' })
  @ApiResponse({ status: 200, description: 'List of sub-scripts for the scenario' })
  @ApiResponse({ status: 400, description: 'Invalid scenario ID' })
  findByScenario(@Param('scenarioId') scenarioId: string) {
    return this.subScriptsService.findByScenario(scenarioId);
  }

  @Post('search-by-keywords')
  @ApiOperation({ summary: 'Search sub-scripts by keywords' })
  @ApiResponse({ status: 200, description: 'List of matching sub-scripts' })
  searchByKeywords(
    @Body() body: { keywords: string[]; scenario_id?: string }
  ) {
    return this.subScriptsService.findByKeywords(body.keywords, body.scenario_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sub-script by ID' })
  @ApiResponse({ status: 200, description: 'Sub-script details' })
  @ApiResponse({ status: 404, description: 'Sub-script not found' })
  findOne(@Param('id') id: string) {
    return this.subScriptsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a sub-script' })
  @ApiResponse({ status: 200, description: 'Sub-script updated successfully' })
  @ApiResponse({ status: 404, description: 'Sub-script not found' })
  update(@Param('id') id: string, @Body() updateSubScriptDto: UpdateSubScriptDto) {
    return this.subScriptsService.update(id, updateSubScriptDto);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Toggle sub-script status (active/inactive)' })
  @ApiResponse({ status: 200, description: 'Sub-script status toggled successfully' })
  @ApiResponse({ status: 404, description: 'Sub-script not found' })
  toggleStatus(@Param('id') id: string) {
    return this.subScriptsService.toggleStatus(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a sub-script' })
  @ApiResponse({ status: 204, description: 'Sub-script deleted successfully' })
  @ApiResponse({ status: 404, description: 'Sub-script not found' })
  remove(@Param('id') id: string) {
    return this.subScriptsService.remove(id);
  }
}