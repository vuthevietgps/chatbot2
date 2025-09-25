import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatBotProcessorService } from './chatbot-processor.service';
import { SubScript, SubScriptSchema } from '../sub-scripts/schemas/sub-script.schema';
import { Script, ScriptSchema } from '../scripts/schemas/script.schema';
import { Fanpage, FanpageSchema } from '../fanpages/schemas/fanpage.schema';
import { FacebookModule } from '../facebook/facebook.module';
import { MessagesModule } from '../messages/messages.module';
import { CustomersModule } from '../customers/customers.module';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubScript.name, schema: SubScriptSchema },
      { name: Script.name, schema: ScriptSchema },
      { name: Fanpage.name, schema: FanpageSchema },
    ]),
    FacebookModule,
    MessagesModule,
    CustomersModule,
    OpenAIModule,
  ],
  providers: [ChatBotProcessorService],
  exports: [ChatBotProcessorService],
})
export class ChatBotModule {}