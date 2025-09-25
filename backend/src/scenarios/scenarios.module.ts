import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScenariosController } from './scenarios.controller';
import { ScenariosService } from './scenarios.service';
import { ScenarioTrigger, ScenarioTriggerSchema } from './schemas/trigger.schema';
import { ScenarioNode, ScenarioNodeSchema } from './schemas/node.schema';
import { ScenarioLink, ScenarioLinkSchema } from './schemas/link.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ScenarioTrigger.name, schema: ScenarioTriggerSchema },
      { name: ScenarioNode.name, schema: ScenarioNodeSchema },
      { name: ScenarioLink.name, schema: ScenarioLinkSchema },
    ]),
  ],
  controllers: [ScenariosController],
  providers: [ScenariosService],
})
export class ScenariosModule {}
