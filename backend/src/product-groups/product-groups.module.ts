import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductGroupsController } from './product-groups.controller';
import { ProductGroupsService } from './product-groups.service';
import { ProductGroup, ProductGroupSchema } from './schemas/product-group.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductGroup.name, schema: ProductGroupSchema },
    ]),
  ],
  controllers: [ProductGroupsController],
  providers: [ProductGroupsService],
})
export class ProductGroupsModule {}
