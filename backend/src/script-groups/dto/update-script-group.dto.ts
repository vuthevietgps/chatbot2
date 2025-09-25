import { PartialType } from '@nestjs/mapped-types';
import { CreateScriptGroupDto } from './create-script-group.dto';

export class UpdateScriptGroupDto extends PartialType(CreateScriptGroupDto) {}
