import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScriptsService } from './scripts.service';
import { ScriptsController } from './scripts.controller';
import { Script, ScriptSchema } from './schemas/script.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Script.name, schema: ScriptSchema }])],
  controllers: [ScriptsController],
  providers: [ScriptsService],
})
export class ScriptsModule {}
