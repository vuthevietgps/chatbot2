import { PartialType } from '@nestjs/mapped-types';
import { CreateFanpageDto } from './create-fanpage.dto';

export class UpdateFanpageDto extends PartialType(CreateFanpageDto) {}
