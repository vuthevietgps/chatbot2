import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { OpenAIService } from './openai.service';
import { OpenAIController } from './openai.controller';
import { OpenAIConfigService } from './openai-config.service';
import { OpenAIConfigController } from './openai-config.controller';
import { OpenAIConfig, OpenAIConfigSchema } from './schemas/openai-config.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: OpenAIConfig.name, schema: OpenAIConfigSchema }
    ])
  ],
  controllers: [OpenAIController, OpenAIConfigController],
  providers: [OpenAIService, OpenAIConfigService],
  exports: [OpenAIService, OpenAIConfigService],
})
export class OpenAIModule {}