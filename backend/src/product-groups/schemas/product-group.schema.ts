import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ProductGroupDocument = ProductGroup & Document;

export enum ProductGroupStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

@Schema({ timestamps: true })
export class ProductGroup {
  @ApiProperty({ description: 'Product group name' })
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @ApiProperty({ description: 'Short description of the product group' })
  @Prop({ trim: true })
  description?: string;

  @ApiProperty({ description: 'Color in hex (e.g., #FF0000)' })
  @Prop({ required: true })
  color: string;

  @ApiProperty({ description: 'Product group status', enum: ProductGroupStatus })
  @Prop({ type: String, enum: ProductGroupStatus, default: ProductGroupStatus.ACTIVE })
  status: ProductGroupStatus;

  @ApiProperty({ description: 'Parent group ID for hierarchy', required: false })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProductGroup', default: null })
  parentGroupId?: string;

  @ApiProperty({ description: 'Soft delete timestamp' })
  @Prop({ default: null })
  deletedAt?: Date;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt?: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt?: Date;
}

export const ProductGroupSchema = SchemaFactory.createForClass(ProductGroup);
