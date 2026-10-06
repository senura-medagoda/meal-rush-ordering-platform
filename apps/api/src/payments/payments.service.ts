import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PayhereService } from './payhere.service';

// Only these fields are stored in the audit log (never card details)
const LOGGED_FIELDS = [
  'order_id',
  'payment_id',
  'payhere_amount',
  'payhere_currency',
  'status_code',
  'status_message',
  'method',
] as const;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payhere: PayhereService,
  ) {}

  async handleNotification(body: Record<string, string | undefined>) {
    // 1. Is this really from PayHere?
    if (!this.payhere.verifyNotification(body) || body.merchant_id !== this.payhere.merchantId) {
      this.logger.warn(`Rejected PayHere notification with invalid signature (order ${body.order_id})`);
      throw new BadRequestException('Invalid signature');
    }

    // 2. Does the order exist, and does the amount match what WE calculated?
    const order = await this.prisma.order.findUnique({ where: { orderNumber: body.order_id } });
    if (!order) throw new NotFoundException('Order not found');

    const amountMatches = Number(body.payhere_amount).toFixed(2) === order.total.toFixed(2);
    if (body.payhere_currency !== 'LKR' || !amountMatches) {
      this.logger.warn(`Amount/currency mismatch on order ${order.orderNumber}`);
      throw new BadRequestException('Amount mismatch');
    }

    // 3. Keep an audit trail
    const payload = Object.fromEntries(LOGGED_FIELDS.map((key) => [key, body[key] ?? null]));
    await this.prisma.paymentLog.create({
      data: {
        orderId: order.id,
        payherePaymentId: body.payment_id ?? null,
        statusCode: Number(body.status_code),
        payload,
      },
    });

    // 4. Update the order. PayHere status codes: 2 success, 0 pending, -1 cancelled, -2 failed, -3 chargedback
    const code = Number(body.status_code);

    if (code === 2) {
      await this.prisma.$transaction([
        // "not PAID" makes this safe if PayHere sends the same notification twice
        this.prisma.order.updateMany({
          where: { id: order.id, paymentStatus: { not: PaymentStatus.PAID } },
          data: { paymentStatus: PaymentStatus.PAID },
        }),
        this.prisma.order.updateMany({
          where: { id: order.id, orderStatus: OrderStatus.PENDING },
          data: { orderStatus: OrderStatus.CONFIRMED },
        }),
      ]);
    } else if (code === -1 || code === -2 || code === -3) {
      const status = code === -1 ? PaymentStatus.CANCELLED : PaymentStatus.FAILED;
      await this.prisma.order.updateMany({
        // never downgrade an order that is already paid by a late or duplicate message
        where: { id: order.id, paymentStatus: { not: PaymentStatus.PAID } },
        data: { paymentStatus: status } satisfies Prisma.OrderUpdateManyMutationInput,
      });
    }
    // code 0 (pending): nothing to change
  }
}