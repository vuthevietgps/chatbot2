import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FanpagesService } from './fanpages.service';
import { FanpagesController } from './fanpages.controller';
import { Fanpage, FanpageSchema } from './schemas/fanpage.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Fanpage.name, schema: FanpageSchema }])],
  controllers: [FanpagesController],
  providers: [FanpagesService],
  exports: [FanpagesService],
})
export class FanpagesModule {}
