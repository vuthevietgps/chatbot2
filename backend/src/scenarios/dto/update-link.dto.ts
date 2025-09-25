import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateLinkDto {
  @IsOptional() @IsString()
  from_node_id?: string;

  @IsOptional() @IsString()
  to_node_id?: string;

  @IsOptional()
  condition?: any;

  @IsOptional() @IsNumber()
  order_index?: number;
}
