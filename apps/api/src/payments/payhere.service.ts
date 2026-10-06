import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';
import type { OrderWithItems } from '../orders/orders.types';

@Injectable()
export class PayhereService {
  constructor(private readonly config: ConfigService) {}

  private md5Upper(value: string): string {
    return createHash('md5').update(value).digest('hex').toUpperCase();
  }

  get merchantId(): string {
    return this.config.getOrThrow<string>('PAYHERE_MERCHANT_ID');
  }

  // md5(secret) uppercased. The raw secret never leaves the server.
  private get secretHash(): string {
    return this.md5Upper(this.config.getOrThrow<string>('PAYHERE_MERCHANT_SECRET'));
  }

  private stripSlash(url: string): string {
    return url.replace(/\/+$/, '');
  }

  /**
   * Builds the data the browser will POST to PayHere.
   * hash = MD5( merchant_id + order_id + amount + currency + MD5(secret) ), uppercase
   */
  buildCheckout(order: OrderWithItems) {
    const frontend = this.stripSlash(this.config.getOrThrow<string>('FRONTEND_URL'));
    const apiPublic = this.stripSlash(this.config.getOrThrow<string>('API_PUBLIC_URL'));

    const amount = order.total.toFixed(2); // PayHere requires exactly 2 decimals, no commas
    const currency = 'LKR';
    const hash = this.md5Upper(this.merchantId + order.orderNumber + amount + currency + this.secretHash);

    const [firstName, ...rest] = order.customerName.trim().split(/\s+/);

    return {
      action: this.config.get<string>('PAYHERE_CHECKOUT_URL') ?? 'https://sandbox.payhere.lk/pay/checkout',
      fields: {
        merchant_id: this.merchantId,
        return_url: `${frontend}/order/${order.orderNumber}?from=payhere`,
        cancel_url: `${frontend}/order/${order.orderNumber}?cancelled=1`,
        notify_url: `${apiPublic}/api/v1/payments/payhere/notify`,
        order_id: order.orderNumber,
        items: `MealRush order ${order.orderNumber}`,
        currency,
        amount,
        first_name: firstName,
        last_name: rest.join(' ') || firstName,
        email: order.customerEmail ?? '',
        phone: order.customerPhone,
        address: order.deliveryAddress,
        city: order.deliveryCity,
        country: 'Sri Lanka',
        hash,
      },
    };
  }

  /**
   * Verifies PayHere's webhook signature:
   * md5sig = MD5( merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(secret) ), uppercase
   */
  verifyNotification(body: Record<string, string | undefined>): boolean {
    const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = body;
    if (!merchant_id || !order_id || !payhere_amount || !payhere_currency || !status_code || !md5sig) {
      return false;
    }

    const expected = Buffer.from(
      this.md5Upper(merchant_id + order_id + payhere_amount + payhere_currency + status_code + this.secretHash),
    );
    const received = Buffer.from(md5sig.toUpperCase());

    // timingSafeEqual avoids leaking information through comparison timing
    return expected.length === received.length && timingSafeEqual(expected, received);
  }
}