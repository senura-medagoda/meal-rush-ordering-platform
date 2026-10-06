import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';
import { UNPAID_ORDER_TTL_MINUTES } from './orders.constants';

@Injectable()
export class OrdersCleanupService {
  private readonly logger = new Logger(OrdersCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  // Every 5 minutes: cancel online-payment orders nobody paid for, and return their stock
  @Interval(5 * 60 * 1000)
  async releaseUnpaidOrders() {
    const cutoff = new Date(Date.now() - UNPAID_ORDER_TTL_MINUTES * 60 * 1000);

    const stale = await this.prisma.order.findMany({
      where: {
        paymentMethod: PaymentMethod.PAYHERE,
        paymentStatus: { in: [PaymentStatus.PENDING, PaymentStatus.FAILED, PaymentStatus.CANCELLED] },
        orderStatus: OrderStatus.PENDING,
        createdAt: { lt: cutoff },
      },
      select: { id: true, orderNumber: true },
    });

    for (const order of stale) {
      if (await this.orders.cancelAndRestock(order.id)) {
        this.logger.log(`Released unpaid order ${order.orderNumber}`);
      }
    }
  }
}