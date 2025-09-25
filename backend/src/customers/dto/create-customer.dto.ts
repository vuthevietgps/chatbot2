import { IsNotEmpty, IsString, IsOptional, IsEmail, IsPhoneNumber, IsEnum, IsArray, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CustomerStatus } from '../schemas/customer.schema';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Customer full name', example: 'Nguyễn Văn A' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Phone number', example: '0123456789', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Email address', example: 'customer@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Facebook User ID', required: false })
  @IsOptional()
  @IsString()
  facebookId?: string;

  @ApiProperty({ description: 'Connected Fanpage ID' })
  @IsOptional()
  @IsMongoId()
  fanpageId?: string;

  @ApiProperty({ description: 'Customer tags', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ description: 'Internal notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Customer status', enum: CustomerStatus, default: CustomerStatus.NEW })
  @IsOptional()
  @IsEnum(CustomerStatus)
  status?: CustomerStatus;

  @ApiProperty({ description: 'Last message timestamp', required: false })
  @IsOptional()
  lastMessageAt?: Date;
}