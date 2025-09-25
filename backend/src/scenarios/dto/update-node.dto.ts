import { IsBoolean, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateNodeDto {
  @IsOptional() @IsIn(['text', 'media', 'carousel', 'quick_reply', 'form', 'action', 'wait', 'ai_reply', 'child_script'])
  type?: string;

  @IsOptional() @IsString()
  name?: string;

  @IsOptional()
  content?: any;

  @IsOptional() @IsNumber()
  position_x?: number;

  @IsOptional() @IsNumber()
  position_y?: number;

  @IsOptional() @IsBoolean()
  is_entry?: boolean;
}
