import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray, IsMongoId, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ActionDto {
  @ApiProperty({
    enum: ['none', 'add_tag', 'set_variable', 'call_webhook'],
    default: 'none'
  })
  @IsEnum(['none', 'add_tag', 'set_variable', 'call_webhook'])
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  key?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  webhook_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tag_name?: string;
}

export class CreateSubScriptDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  scenario_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  trigger_keywords?: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  response_template: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  product_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  product_group_id?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ enum: ['active', 'inactive'], default: 'active' })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ActionDto)
  action?: ActionDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  context_required?: string;

  @ApiPropertyOptional({ default: 'contains' })
  @IsOptional()
  @IsString()
  match_mode?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  created_by: string;
}