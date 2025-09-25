import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ProductGroupsModule } from './product-groups/product-groups.module';
import { FanpagesModule } from './fanpages/fanpages.module';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { ScriptGroupsModule } from './script-groups/script-groups.module';
import { ScriptsModule } from './scripts/scripts.module';
import { FacebookModule } from './facebook/facebook.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { WebhookLogsModule } from './webhook-logs/webhook-logs.module';
import { WebhookModule } from './webhook/webhook.module';
import { ScenariosModule } from './scenarios/scenarios.module';
import { SubScriptsModule } from './sub-scripts/sub-scripts.module';
import { CustomersModule } from './customers/customers.module';
import { RealtimeModule } from './realtime/realtime.module';
import { OpenAIModule } from './openai/openai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb+srv://your-connection-string'),
  UsersModule,
  ProductGroupsModule,
  FanpagesModule,
  ProductsModule,
  ScriptGroupsModule,
  ScriptsModule,
  FacebookModule,
  ConversationsModule,
  MessagesModule,
  WebhookLogsModule,
  WebhookModule,
  ScenariosModule,
  SubScriptsModule,
  CustomersModule,
  RealtimeModule,
  OpenAIModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}