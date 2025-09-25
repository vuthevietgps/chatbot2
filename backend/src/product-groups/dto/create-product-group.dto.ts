import { IsNotEmpty, IsString, Matches, IsOptional, IsEnum, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductGroupStatus } from '../schemas/product-group.schema';

export class CreateProductGroupDto {
  @ApiProperty({ description: 'Product group name', example: 'Điện thoại' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Short description', example: 'Các sản phẩm điện thoại di động', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Color hex', example: '#3f51b5' })
  @IsNotEmpty()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
  color: string;

  @ApiProperty({ description: 'Product group status', enum: ProductGroupStatus, default: ProductGroupStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ProductGroupStatus)
  status?: ProductGroupStatus;

  @ApiProperty({ description: 'Parent group ID', required: false })
  @IsOptional()
  @IsMongoId()
  parentGroupId?: string;
}
