import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubScriptsService } from './sub-scripts.service';
import { SubScriptsController } from './sub-scripts.controller';
import { SubScript, SubScriptSchema } from './schemas/sub-script.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubScript.name, schema: SubScriptSchema }
    ])
  ],
  controllers: [SubScriptsController],
  providers: [SubScriptsService],
  exports: [SubScriptsService]
})
export class SubScriptsModule {}