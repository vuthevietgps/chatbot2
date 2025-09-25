import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

export enum ProductCurrency {
  VND = 'VND',
  USD = 'USD',
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
}

@Schema({ _id: true, timestamps: true })
export class ProductVariant {
  @Prop({ required: true }) attribute: string;
  @Prop({ required: true }) value: string;
  @Prop({ type: Number, min: 0 }) extraPrice?: number;
}
export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);

@Schema({ timestamps: true })
export class Product {
  // Use Mongo _id as product id

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true })
  sku: string;

  @Prop({ type: Types.ObjectId, ref: 'ProductGroup', required: true, index: true })
  groupId: Types.ObjectId;

  @Prop({ trim: true })
  shortDescription?: string;

  @Prop()
  description?: string;

  @Prop({ type: Number, required: true, min: 0 })
  price: number;

  @Prop({ type: Number, min: 0 })
  salePrice?: number;

  @Prop({ type: String, enum: Object.values(ProductCurrency), default: ProductCurrency.VND })
  currency: ProductCurrency;

  @Prop({ type: String, enum: Object.values(ProductStatus), default: ProductStatus.ACTIVE })
  status: ProductStatus;

  @Prop({ type: Number, default: 0, min: 0 })
  stock: number;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [ProductVariantSchema], default: [] })
  variants: ProductVariant[];

  @Prop({ type: Boolean, default: false })
  featured: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
