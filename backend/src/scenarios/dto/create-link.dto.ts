import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateLinkDto {
  @IsString()
  from_node_id: string;

  @IsString()
  to_node_id: string;

  @IsOptional()
  condition?: any;

  @IsOptional() @IsNumber()
  order_index?: number;
}
