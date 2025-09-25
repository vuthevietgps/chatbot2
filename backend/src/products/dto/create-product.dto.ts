import { IsArray, IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductCurrency, ProductStatus } from '../schemas/product.schema';

export class ProductVariantDto {
  @IsString() @IsNotEmpty()
  attribute: string;

  @IsString() @IsNotEmpty()
  value: string;

  @IsOptional() @IsNumber() @Min(0)
  extraPrice?: number;
}

export class CreateProductDto {
  @IsString() @IsNotEmpty() @MaxLength(200)
  name: string;

  @IsString() @IsNotEmpty() @MaxLength(100)
  sku: string;

  @IsMongoId()
  groupId: string;

  @IsOptional() @IsString() @MaxLength(500)
  shortDescription?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsNumber() @Min(0)
  price: number;

  @IsOptional() @IsNumber() @Min(0)
  salePrice?: number;

  @IsOptional() @IsEnum(ProductCurrency)
  currency?: ProductCurrency;

  @IsOptional() @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional() @IsNumber() @Min(0)
  stock?: number;

  @IsOptional() @IsArray()
  @IsUrl(undefined, { each: true })
  images?: string[];

  @IsOptional() @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @IsOptional() @IsBoolean()
  featured?: boolean;

  @IsOptional() @IsMongoId()
  createdBy?: string;
}
