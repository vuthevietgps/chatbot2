import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { ProductGroupsService, ProductGroupResponse } from './product-groups.service';
import { CreateProductGroupDto } from './dto/create-product-group.dto';
import { UpdateProductGroupDto } from './dto/update-product-group.dto';
import { ProductGroupStatus } from './schemas/product-group.schema';

@ApiTags('Product Groups')
@Controller('product-groups')
export class ProductGroupsController {
  constructor(private readonly service: ProductGroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new product group' })
  @ApiResponse({ status: 201, description: 'Product group created successfully' })
  create(@Body() dto: CreateProductGroupDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List product groups with filtering and pagination' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name' })
  @ApiQuery({ name: 'status', required: false, enum: ProductGroupStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'includeDeleted', required: false, type: Boolean, description: 'Include soft deleted items' })
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: ProductGroupStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('includeDeleted') includeDeleted?: boolean,
  ) {
    return this.service.findAll({ search, status, page, limit, includeDeleted });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product group by ID' })
  @ApiResponse({ status: 200, description: 'Product group details' })
  @ApiResponse({ status: 404, description: 'Product group not found' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Get products in this group' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getProducts(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getProducts(id, { page, limit });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product group' })
  @ApiResponse({ status: 200, description: 'Product group updated successfully' })
  update(@Param('id') id: string, @Body() dto: UpdateProductGroupDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete product group' })
  @ApiResponse({ status: 200, description: 'Product group deleted successfully' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
