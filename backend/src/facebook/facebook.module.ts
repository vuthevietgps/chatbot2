import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FacebookController } from './facebook.controller';
import { FacebookService } from './facebook.service';
import { FacebookSendService } from './facebook-send.service';
import { Fanpage, FanpageSchema } from '../fanpages/schemas/fanpage.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Fanpage.name, schema: FanpageSchema }])],
  controllers: [FacebookController],
  providers: [FacebookService, FacebookSendService],
  exports: [FacebookService, FacebookSendService],
})
export class FacebookModule {}
