import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class CreateTriggerDto {
  @IsIn(['keyword', 'event', 'time'])
  type: 'keyword' | 'event' | 'time';

  @IsIn(['contains', 'exact', 'regex'])
  match_mode: 'contains' | 'exact' | 'regex';

  @IsString()
  value: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}
