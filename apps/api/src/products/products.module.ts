import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { AdminProductsController } from './admin-products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService],
  exports: [ProductsService], // the Orders module will need it on Day 2
})
export class ProductsModule {}