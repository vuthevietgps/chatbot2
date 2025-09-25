import { IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class CreateWebhookLogDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  pageId: string;

  raw: any; // JSON object, no validation needed

  @IsOptional()
  headers?: any;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsDateString()
  createdAt?: string;
}