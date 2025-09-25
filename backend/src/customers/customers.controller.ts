import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CustomersService, CustomerResponse } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerStatus } from './schemas/customer.schema';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers with filtering and pagination' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, phone, email, or notes' })
  @ApiQuery({ name: 'status', required: false, enum: CustomerStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'tag', required: false, description: 'Filter by tag' })
  @ApiQuery({ name: 'fanpageId', required: false, description: 'Filter by fanpage' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean, description: 'Include soft deleted items' })
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: CustomerStatus,
    @Query('tag') tag?: string,
    @Query('fanpageId') fanpageId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('includeDeleted') includeDeleted?: boolean,
  ): Promise<CustomerResponse> {
    return this.customersService.findAll({
      search,
      status,
      tag,
      fanpageId,
      page,
      limit,
      includeDeleted,
    });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get customer statistics' })
  @ApiResponse({ status: 200, description: 'Customer statistics' })
  getStatistics() {
    return this.customersService.getStats();
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get available customer tags' })
  @ApiResponse({ status: 200, description: 'List of available tags' })
  getTags() {
    return this.customersService.getTags();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer details' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Get(':id/conversations')
  @ApiOperation({ summary: 'Get customer conversations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getConversations(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.customersService.getConversations(id, page, limit);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete customer' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }

  // Special endpoints for integration
  @Post('from-facebook')
  @ApiOperation({ summary: 'Create customer from Facebook message (internal use)' })
  createFromFacebook(@Body() data: {
    name: string;
    facebookId: string;
    fanpageId: string;
  }) {
    return this.customersService.createFromFacebookMessage(data);
  }

  @Patch('update-from-script')
  @ApiOperation({ summary: 'Update customer from script data (internal use)' })
  updateFromScript(@Body() data: {
    facebookId: string;
    fanpageId: string;
    phone?: string;
    email?: string;
    tags?: string[];
    notes?: string;
  }) {
    const { facebookId, fanpageId, ...updateData } = data;
    return this.customersService.updateFromScript(facebookId, fanpageId, updateData);
  }
}