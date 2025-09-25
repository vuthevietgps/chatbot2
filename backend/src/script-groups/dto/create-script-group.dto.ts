import { IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ScriptGroupStatus } from '../schemas/script-group.schema';

export class CreateScriptGroupDto {
  @IsString() @IsNotEmpty() @MaxLength(200)
  name: string;

  @IsOptional() @IsString()
  description?: string;

  @IsMongoId()
  pageId: string; // ref Fanpage

  @IsMongoId()
  productGroupId: string; // ref ProductGroup

  @IsEnum(ScriptGroupStatus)
  status: ScriptGroupStatus;

  @IsOptional() @IsNumber() @Min(0)
  priority?: number;

  @IsOptional() @IsBoolean()
  aiEnabled?: boolean;

  @IsOptional() @IsMongoId()
  createdBy?: string;
}
