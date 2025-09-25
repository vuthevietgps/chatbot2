import { IsString, IsEnum, IsOptional, IsMongoId, IsDateString } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  id: string;

  @IsString()
  pageId: string;

  @IsString()
  psid: string;

  @IsOptional()
  @IsMongoId()
  customerId?: string;

  @IsEnum(['open', 'closed', 'pending'])
  @IsOptional()
  status?: string;

  @IsString()
  lastMessage: string;

  @IsDateString()
  lastUpdated: string;
}