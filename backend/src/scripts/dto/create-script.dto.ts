import { IsArray, IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ScriptAction, ScriptStatus } from '../schemas/script.schema';

export class CreateScriptDto {
  @IsOptional() @IsString()
  id?: string; // UUID, optional on create (auto-generate)

  @IsMongoId()
  scriptGroupId: string;

  @IsString() @IsNotEmpty() @MaxLength(200)
  name: string;

  @IsArray()
  @IsString({ each: true })
  trigger: string[];

  @IsString() @IsNotEmpty()
  responseTemplate: string;

  @IsOptional() @IsMongoId()
  linkedProductId?: string;

  @IsOptional() @IsMongoId()
  linkedProductGroupId?: string;

  @IsOptional() @IsNumber() @Min(0)
  priority?: number;

  @IsEnum(ScriptStatus)
  status: ScriptStatus;

  @IsOptional() @IsString()
  contextRequirement?: string;

  @IsOptional() @IsBoolean()
  aiAssist?: boolean;

  @IsOptional() @IsEnum(ScriptAction)
  action?: ScriptAction;
}
