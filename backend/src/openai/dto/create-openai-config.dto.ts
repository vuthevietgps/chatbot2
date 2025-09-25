import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsArray, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOpenAIConfigDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @IsEnum(['gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'])
  model: string = 'gpt-3.5-turbo';

  @IsNumber()
  @Min(50)
  @Max(4000)
  @Type(() => Number)
  maxTokens: number = 500;

  @IsNumber()
  @Min(0)
  @Max(2)
  @Type(() => Number)
  temperature: number = 0.7;

  @IsOptional()
  @IsNumber()
  @Min(-2)
  @Max(2)
  @Type(() => Number)
  presencePenalty?: number = 0.1;

  @IsOptional()
  @IsNumber()
  @Min(-2)
  @Max(2)
  @Type(() => Number)
  frequencyPenalty?: number = 0.1;

  @IsString()
  @IsNotEmpty()
  systemPrompt: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableScenarios?: string[] = [];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicableFanpages?: string[] = [];

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string = 'active';

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;

  @IsOptional()
  @IsString()
  createdBy?: string;
}