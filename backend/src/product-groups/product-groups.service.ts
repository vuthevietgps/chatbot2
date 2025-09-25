import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductGroup, ProductGroupDocument, ProductGroupStatus } from './schemas/product-group.schema';
import { CreateProductGroupDto } from './dto/create-product-group.dto';
import { UpdateProductGroupDto } from './dto/update-product-group.dto';

export interface QueryOptions {
  search?: string;
  status?: ProductGroupStatus;
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}

export interface ProductGroupResponse {
  data: ProductGroup[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable()
export class ProductGroupsService {
  constructor(
    @InjectModel(ProductGroup.name) private pgModel: Model<ProductGroupDocument>,
  ) {}

  async create(dto: CreateProductGroupDto): Promise<ProductGroup> {
    try {
      const created = new this.pgModel(dto);
      return await created.save();
    } catch (e) {
      if (e.code === 11000) {
        throw new BadRequestException('Product group name already exists');
      }
      throw new BadRequestException('Failed to create product group');
    }
  }

  async findAll(options: QueryOptions = {}): Promise<ProductGroupResponse> {
    const { search, status, page = 1, limit = 10, includeDeleted = false } = options;
    
    // Build query
    const query: any = {};
    
    // Soft delete filter
    if (!includeDeleted) {
      query.deletedAt = null;
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.pgModel
        .find(query)
        .populate('parentGroupId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.pgModel.countDocuments(query).exec()
    ]);
    
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: string): Promise<ProductGroup> {
    const group = await this.pgModel
      .findOne({ _id: id, deletedAt: null })
      .populate('parentGroupId', 'name')
      .exec();
    
    if (!group) {
      throw new NotFoundException('Product group not found');
    }
    
    return group;
  }

  async getProducts(groupId: string, options: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 10 } = options;
    
    // First verify the group exists
    const group = await this.findOne(groupId);
    
    // This would require Product model to be injected
    // For now, return a placeholder response
    const skip = (page - 1) * limit;
    
    return {
      data: [], // TODO: Implement when Product model is available
      total: 0,
      page,
      totalPages: 0,
      groupName: group.name
    };
  }

  async update(id: string, dto: UpdateProductGroupDto): Promise<ProductGroup> {
    try {
      const updated = await this.pgModel
        .findOneAndUpdate(
          { _id: id, deletedAt: null },
          dto,
          { new: true }
        )
        .populate('parentGroupId', 'name')
        .exec();
      
      if (!updated) {
        throw new NotFoundException('Product group not found');
      }
      
      return updated;
    } catch (e) {
      if (e.code === 11000) {
        throw new BadRequestException('Product group name already exists');
      }
      throw e;
    }
  }

  async remove(id: string): Promise<void> {
    const updated = await this.pgModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { deletedAt: new Date() },
        { new: true }
      )
      .exec();
    
    if (!updated) {
      throw new NotFoundException('Product group not found');
    }
  }

  // Helper method for getting active groups (used in dropdowns)
  async getActiveGroups(): Promise<ProductGroup[]> {
    return this.pgModel
      .find({ 
        status: ProductGroupStatus.ACTIVE, 
        deletedAt: null 
      })
      .sort({ name: 1 })
      .exec();
  }
}
