import { IsString, IsOptional, IsArray } from 'class-validator';

export class SendMessageDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsArray()
  attachments?: any[];
}

export class UpdateConversationStatusDto {
  @IsString()
  status: string;
}