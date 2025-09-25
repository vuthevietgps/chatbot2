import { IsString, IsEnum, IsOptional, IsMongoId, IsDateString, IsArray } from 'class-validator';

export class CreateMessageDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsMongoId()
  conversationId: string;

  @IsString()
  pageId: string;

  @IsString()
  psid: string;

  @IsEnum(['in', 'out'])
  direction: string;

  @IsEnum(['customer', 'bot', 'agent'])
  senderType: string;

  @IsString()
  text: string;

  @IsOptional()
  @IsArray()
  attachments?: any[];

  @IsOptional()
  @IsString()
  fbMessageId?: string;

  @IsEnum(['script', 'ai', 'agent', 'none'])
  @IsOptional()
  processedBy?: string;

  @IsEnum(['received', 'processed', 'sent', 'error'])
  @IsOptional()
  status?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: string;
}