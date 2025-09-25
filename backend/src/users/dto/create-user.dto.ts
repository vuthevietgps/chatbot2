import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum, IsBoolean, IsDateString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({ description: 'User full name', example: 'Nguyễn Văn An' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({ description: 'User email', example: 'nguyen.van.an@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User phone number', example: '0123456789' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ description: 'User password (minimum 6 characters)', example: 'password123' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ 
    description: 'User role', 
    enum: UserRole, 
    example: UserRole.EMPLOYEE 
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ description: 'User department', example: 'IT Department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'User position', example: 'Software Developer' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ description: 'User avatar URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: 'Date of birth', example: '1990-01-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date;

  @ApiPropertyOptional({ description: 'User status', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}