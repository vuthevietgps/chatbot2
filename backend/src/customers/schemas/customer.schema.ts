import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type CustomerDocument = Customer & Document;

export enum CustomerStatus {
  NEW = 'new',
  POTENTIAL = 'potential',
  VIP = 'vip',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

@Schema({ timestamps: true })
export class Customer {
  @ApiProperty({ description: 'Customer full name' })
  @Prop({ required: true, trim: true })
  name: string;

  @ApiProperty({ description: 'Phone number (unique)', required: false })
  @Prop({ unique: true, sparse: true, trim: true })
  phone?: string;

  @ApiProperty({ description: 'Email address (unique)', required: false })
  @Prop({ unique: true, sparse: true, trim: true, lowercase: true })
  email?: string;

  @ApiProperty({ description: 'Facebook User ID', required: false })
  @Prop({ trim: true })
  facebookId?: string;

  @ApiProperty({ description: 'Connected Fanpage ID' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Fanpage', required: false })
  fanpageId?: string;

  @ApiProperty({ description: 'Customer tags for categorization', type: [String] })
  @Prop({ type: [String], default: [] })
  tags: string[];

  @ApiProperty({ description: 'Internal notes', required: false })
  @Prop({ trim: true })
  notes?: string;

  @ApiProperty({ description: 'Custom variables from scripts', required: false })
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  customVariables?: { [key: string]: string };

  @ApiProperty({ description: 'Customer status', enum: CustomerStatus })
  @Prop({ type: String, enum: CustomerStatus, default: CustomerStatus.NEW })
  status: CustomerStatus;

  @ApiProperty({ description: 'Last message timestamp', required: false })
  @Prop({ default: null })
  lastMessageAt?: Date;

  @ApiProperty({ description: 'Soft delete timestamp', required: false })
  @Prop({ default: null })
  deletedAt?: Date;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt?: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt?: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

// Indexes for performance
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ facebookId: 1 });
CustomerSchema.index({ fanpageId: 1 });
CustomerSchema.index({ status: 1 });
CustomerSchema.index({ tags: 1 });
CustomerSchema.index({ lastMessageAt: -1 });
CustomerSchema.index({ createdAt: -1 });
CustomerSchema.index({ deletedAt: 1 });

// Compound indexes
CustomerSchema.index({ fanpageId: 1, facebookId: 1 });
CustomerSchema.index({ fanpageId: 1, phone: 1 });
CustomerSchema.index({ fanpageId: 1, email: 1 });