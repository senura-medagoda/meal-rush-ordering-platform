import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { OrdersController } from './orders.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminStatsController } from './admin-stats.controller';
import { OrdersService } from './orders.service';
import { OrdersCleanupService } from './orders-cleanup.service';

@Module({
  imports: [PaymentsModule],
  controllers: [OrdersController, AdminOrdersController, AdminStatsController],
  providers: [OrdersService, OrdersCleanupService],
  exports: [OrdersService],
})
export class OrdersModule {}