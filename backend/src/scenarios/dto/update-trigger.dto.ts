import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateTriggerDto {
  @IsOptional() @IsIn(['keyword', 'event', 'time'])
  type?: 'keyword' | 'event' | 'time';

  @IsOptional() @IsIn(['contains', 'exact', 'regex'])
  match_mode?: 'contains' | 'exact' | 'regex';

  @IsOptional() @IsString()
  value?: string;

  @IsOptional() @IsBoolean()
  is_active?: boolean;
}
