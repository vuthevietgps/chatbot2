import { PartialType } from '@nestjs/swagger';
import { CreateSubScriptDto } from './create-sub-script.dto';

export class UpdateSubScriptDto extends PartialType(CreateSubScriptDto) {}