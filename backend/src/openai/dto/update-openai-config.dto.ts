import { PartialType } from '@nestjs/mapped-types';
import { CreateOpenAIConfigDto } from './create-openai-config.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateOpenAIConfigDto extends PartialType(CreateOpenAIConfigDto) {
  @IsOptional()
  @IsString()
  updatedBy?: string;
}