import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument, ProductStatus } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

export interface ProductQuery {
  search?: string;
  sku?: string;
  groupId?: string;
  status?: ProductStatus;
  page?: number;
  limit?: number;
}

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private model: Model<ProductDocument>) {}

  async create(dto: CreateProductDto): Promise<Product> {
    try {
      // Auto set out_of_stock if stock is 0
      let status = dto.status || ProductStatus.ACTIVE;
      if (dto.stock === 0) {
        status = ProductStatus.OUT_OF_STOCK;
      }

      const doc = new this.model({
        ...dto,
        status,
        groupId: new Types.ObjectId(dto.groupId),
        createdBy: dto.createdBy ? new Types.ObjectId(dto.createdBy) : undefined,
      } as any);
      return await doc.save();
    } catch (e: any) {
      if (e?.code === 11000) {
        const field = e.keyPattern?.sku ? 'SKU' : 'Product';
        throw new BadRequestException(`${field} already exists`);
      }
      throw e;
    }
  }

  async findAll(query: ProductQuery = {}): Promise<{ data: Product[]; total: number }> {
    const { search, sku, groupId, status, page = 1, limit = 10 } = query;
    
    // Build filter
    const filter: any = { deletedAt: { $exists: false } }; // Exclude soft deleted
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (sku) {
      filter.sku = { $regex: sku, $options: 'i' };
    }
    
    if (groupId) {
      filter.groupId = new Types.ObjectId(groupId);
    }
    
    if (status) {
      filter.status = status;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('groupId', 'name color')
        .populate('createdBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments(filter)
    ]);

    return { data, total };
  }

  async findOne(id: string): Promise<Product> {
    const doc = await this.model
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .populate('groupId', 'name color')
      .populate('createdBy', 'fullName email')
      .lean();
    if (!doc) throw new NotFoundException('Product not found');
    return doc;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const payload: any = { ...dto };
    if (dto.groupId) payload.groupId = new Types.ObjectId(dto.groupId);
    if (dto.createdBy) payload.createdBy = new Types.ObjectId(dto.createdBy);
    
    // Auto set out_of_stock if stock becomes 0
    if (dto.stock === 0) {
      payload.status = ProductStatus.OUT_OF_STOCK;
    }
    
    try {
      const updated = await this.model
        .findOneAndUpdate(
          { _id: id, deletedAt: { $exists: false } },
          payload,
          { new: true }
        )
        .populate('groupId', 'name color')
        .populate('createdBy', 'fullName email')
        .lean();
      if (!updated) throw new NotFoundException('Product not found');
      return updated;
    } catch (e: any) {
      if (e?.code === 11000) {
        const field = e.keyPattern?.sku ? 'SKU' : 'Product';
        throw new BadRequestException(`${field} already exists`);
      }
      throw e;
    }
  }

  async toggleStatus(id: string): Promise<Product> {
    const product = await this.model.findOne({ _id: id, deletedAt: { $exists: false } });
    if (!product) throw new NotFoundException('Product not found');
    
    // Toggle between active and inactive (skip out_of_stock)
    let newStatus = ProductStatus.ACTIVE;
    if (product.status === ProductStatus.ACTIVE) {
      newStatus = ProductStatus.INACTIVE;
    }
    
    product.status = newStatus;
    await product.save();
    
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.model.findOneAndUpdate(
      { _id: id, deletedAt: { $exists: false } },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!result) throw new NotFoundException('Product not found');
  }

  async getStatistics() {
    const filter = { deletedAt: { $exists: false } };
    
    const [total, active, inactive, outOfStock] = await Promise.all([
      this.model.countDocuments(filter),
      this.model.countDocuments({ ...filter, status: ProductStatus.ACTIVE }),
      this.model.countDocuments({ ...filter, status: ProductStatus.INACTIVE }),
      this.model.countDocuments({ ...filter, status: ProductStatus.OUT_OF_STOCK })
    ]);

    return {
      total,
      active,
      inactive,
      outOfStock
    };
  }
}
