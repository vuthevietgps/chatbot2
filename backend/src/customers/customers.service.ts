import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument, CustomerStatus } from './schemas/customer.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

export interface CustomerQuery {
  search?: string;
  status?: CustomerStatus;
  tag?: string;
  fanpageId?: string;
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}

export interface CustomerResponse {
  data: Customer[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CustomerStats {
  total: number;
  new: number;
  potential: number;
  vip: number;
  inactive: number;
  blocked: number;
  withPhone: number;
  withEmail: number;
  lastWeek: number;
}

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    try {
      // Check for duplicate phone/email
      await this.validateUniqueFields(createCustomerDto.phone, createCustomerDto.email);

      const customer = new this.customerModel(createCustomerDto);
      return await customer.save();
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new BadRequestException(`${field} already exists`);
      }
      throw error;
    }
  }

  async findAll(query: CustomerQuery = {}): Promise<CustomerResponse> {
    const {
      search,
      status,
      tag,
      fanpageId,
      page = 1,
      limit = 10,
      includeDeleted = false,
    } = query;

    // Build filter query
    const filter: any = {};

    // Soft delete filter
    if (!includeDeleted) {
      filter.deletedAt = null;
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Fanpage filter
    if (fanpageId) {
      filter.fanpageId = fanpageId;
    }

    // Tag filter
    if (tag) {
      filter.tags = { $in: [tag] };
    }

    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.customerModel
        .find(filter)
        .populate('fanpageId', 'pageName')
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.customerModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerModel
      .findOne({ _id: id, deletedAt: null })
      .populate('fanpageId', 'pageName')
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    try {
      // Check for duplicate phone/email if they're being updated
      if (updateCustomerDto.phone || updateCustomerDto.email) {
        await this.validateUniqueFields(
          updateCustomerDto.phone,
          updateCustomerDto.email,
          id
        );
      }

      const customer = await this.customerModel
        .findOneAndUpdate(
          { _id: id, deletedAt: null },
          updateCustomerDto,
          { new: true }
        )
        .populate('fanpageId', 'pageName')
        .exec();

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      return customer;
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new BadRequestException(`${field} already exists`);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const customer = await this.customerModel
      .findOneAndUpdate(
        { _id: id, deletedAt: null },
        { deletedAt: new Date() },
        { new: true }
      )
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
  }

  // Find customer by Facebook ID and fanpage
  async findByFacebookId(facebookId: string, fanpageId: string): Promise<CustomerDocument | null> {
    try {
      const customer = await this.customerModel
        .findOne({
          facebookId,
          fanpageId,
          deletedAt: null,
        })
        .exec();
      
      return customer;
    } catch (error) {
      throw new BadRequestException(`Error finding customer: ${error.message}`);
    }
  }

  // Auto-create customer from Facebook message
  async createFromFacebookMessage(data: {
    name: string;
    facebookId: string;
    fanpageId: string;
  }): Promise<Customer> {
    // Check if customer already exists
    const existing = await this.findByFacebookId(data.facebookId, data.fanpageId);

    if (existing) {
      // Update last message time
      existing.lastMessageAt = new Date();
      return await existing.save();
    }

    // Create new customer
    const customer = new this.customerModel({
      name: data.name,
      facebookId: data.facebookId,
      fanpageId: data.fanpageId,
      status: CustomerStatus.NEW,
      lastMessageAt: new Date(),
      tags: ['Facebook Inbox'],
    });

    return await customer.save();
  }

  // Update customer with collected info from scripts
  async updateFromScript(
    facebookId: string,
    fanpageId: string,
    data: {
      phone?: string;
      email?: string;
      tags?: string[];
      notes?: string;
      variables?: { [key: string]: string };
    }
  ): Promise<Customer> {
    const customer = await this.customerModel
      .findOne({
        facebookId,
        fanpageId,
        deletedAt: null,
      })
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Update fields
    if (data.phone && !customer.phone) {
      customer.phone = data.phone;
    }
    if (data.email && !customer.email) {
      customer.email = data.email;
    }
    if (data.tags) {
      customer.tags = [...new Set([...customer.tags, ...data.tags])];
    }
    if (data.notes) {
      customer.notes = customer.notes ? `${customer.notes}\n${data.notes}` : data.notes;
    }
    if (data.variables) {
      // Merge variables (existing variables take precedence)
      customer.customVariables = {
        ...data.variables,
        ...customer.customVariables
      };
    }

    customer.lastMessageAt = new Date();
    return await customer.save();
  }

  // Get customer conversations
  async getConversations(customerId: string, page = 1, limit = 10) {
    const customer = await this.findOne(customerId);
    
    // This would integrate with conversations service
    // For now, return placeholder
    return {
      customer,
      conversations: [],
      total: 0,
      page,
      totalPages: 0,
    };
  }

  // Get statistics
  async getStats(): Promise<CustomerStats> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [
      total,
      newCount,
      potentialCount,
      vipCount,
      inactiveCount,
      blockedCount,
      withPhone,
      withEmail,
      lastWeek,
    ] = await Promise.all([
      this.customerModel.countDocuments({ deletedAt: null }),
      this.customerModel.countDocuments({ status: CustomerStatus.NEW, deletedAt: null }),
      this.customerModel.countDocuments({ status: CustomerStatus.POTENTIAL, deletedAt: null }),
      this.customerModel.countDocuments({ status: CustomerStatus.VIP, deletedAt: null }),
      this.customerModel.countDocuments({ status: CustomerStatus.INACTIVE, deletedAt: null }),
      this.customerModel.countDocuments({ status: CustomerStatus.BLOCKED, deletedAt: null }),
      this.customerModel.countDocuments({ phone: { $exists: true, $ne: null }, deletedAt: null }),
      this.customerModel.countDocuments({ email: { $exists: true, $ne: null }, deletedAt: null }),
      this.customerModel.countDocuments({ createdAt: { $gte: oneWeekAgo }, deletedAt: null }),
    ]);

    return {
      total,
      new: newCount,
      potential: potentialCount,
      vip: vipCount,
      inactive: inactiveCount,
      blocked: blockedCount,
      withPhone,
      withEmail,
      lastWeek,
    };
  }

  // Get available tags
  async getTags(): Promise<string[]> {
    const result = await this.customerModel
      .aggregate([
        { $match: { deletedAt: null } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 50 },
      ])
      .exec();

    return result.map(item => item._id);
  }

  private async validateUniqueFields(
    phone?: string,
    email?: string,
    excludeId?: string
  ): Promise<void> {
    const query: any = { deletedAt: null };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    if (phone) {
      const existingPhone = await this.customerModel.findOne({
        ...query,
        phone,
      }).exec();
      
      if (existingPhone) {
        throw new BadRequestException('Phone number already exists');
      }
    }

    if (email) {
      const existingEmail = await this.customerModel.findOne({
        ...query,
        email,
      }).exec();
      
      if (existingEmail) {
        throw new BadRequestException('Email already exists');
      }
    }
  }
}