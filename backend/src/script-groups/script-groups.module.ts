import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScriptGroupsController } from './script-groups.controller';
import { ScriptGroupsService } from './script-groups.service';
import { ScriptGroup, ScriptGroupSchema } from './schemas/script-group.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ScriptGroup.name, schema: ScriptGroupSchema },
    ]),
  ],
  controllers: [ScriptGroupsController],
  providers: [ScriptGroupsService],
  exports: [ScriptGroupsService],
})
export class ScriptGroupsModule {}
