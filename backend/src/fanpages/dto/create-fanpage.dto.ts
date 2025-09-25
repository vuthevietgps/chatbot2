import { IsArray, IsBoolean, IsDateString, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { FanpageStatus } from '../schemas/fanpage.schema';

export class CreateFanpageDto {
  @IsString() @IsNotEmpty() @MaxLength(100)
  pageId: string;

  @IsString() @IsNotEmpty() @MaxLength(200)
  pageName: string;

  @IsString() @IsNotEmpty()
  accessToken: string;

  @IsEnum(FanpageStatus)
  status: FanpageStatus;

  @IsDateString()
  connectedAt: string;

  @IsOptional() @IsDateString()
  lastRefreshed?: string;

  @IsOptional() @IsMongoId()
  connectedBy?: string;

  @IsOptional() @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional() @IsUrl()
  avatarUrl?: string;

  @IsOptional() @IsNumber()
  subscriberCount?: number;

  @IsOptional() @IsMongoId()
  defaultScriptGroupId?: string;

  @IsOptional() @IsMongoId()
  defaultProductGroupId?: string;

  @IsOptional() @IsBoolean()
  webhookSubscribed?: boolean;

  @IsOptional() @IsNumber()
  messageQuota?: number;

  @IsOptional() @IsNumber()
  messagesSentThisMonth?: number;

  @IsOptional() @IsBoolean()
  aiEnabled?: boolean;

  @IsOptional() @IsString()
  timeZone?: string;
}
