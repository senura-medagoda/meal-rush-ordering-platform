import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PayhereService } from '../payments/payhere.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from './orders.constants';
import { generateOrderNumber } from './order-number.util';
import { buildWhatsAppMessage } from './whatsapp.util';
import type { OrderWithItems } from './orders.types';

// Which status changes the admin may make
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  CONFIRMED: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  PREPARING: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  DELIVERED: [],
  CANCELLED: [],
};

const trackingSelect = {
  orderNumber: true,
  orderStatus: true,
  paymentStatus: true,
  paymentMethod: true,
  subtotal: true,
  deliveryFee: true,
  total: true,
  createdAt: true,
  items: { select: { productName: true, unitPrice: true, quantity: true } },
} satisfies Prisma.OrderSelect;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly payhere: PayhereService,
  ) {}

  // ================= Customer =================

  async create(dto: CreateOrderDto, userId?: number) {
    // Merge duplicate lines (same product twice) into one quantity
    const quantities = new Map<number, number>();
    for (const line of dto.items) {
      quantities.set(line.productId, (quantities.get(line.productId) ?? 0) + line.quantity);
    }
    for (const qty of quantities.values()) {
      if (qty > 20) throw new BadRequestException('You can order at most 20 of one item');
    }
    const productIds = [...quantities.keys()];

    // One transaction: either the whole order is saved and stock reserved, or nothing is.
    const order = await this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        orderBy: { id: 'asc' },
      });
      if (products.length !== productIds.length) {
        throw new BadRequestException('Some items in your cart are no longer on the menu');
      }

      let subtotal = new Prisma.Decimal(0);
      const lines: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = [];

      for (const product of products) {
        const quantity = quantities.get(product.id)!;

        if (!product.isAvailable) {
          throw new BadRequestException(`${product.name} is currently unavailable`);
        }

        // Atomic reservation: only succeeds if enough stock is still there.
        const reserved = await tx.product.updateMany({
          where: { id: product.id, stock: { gte: quantity } },
          data: { stock: { decrement: quantity } },
        });
        if (reserved.count === 0) {
          throw new ConflictException(`Sorry, there is not enough stock left for ${product.name}`);
        }

        // The price comes from the DATABASE, never from the browser.
        subtotal = subtotal.add(product.price.mul(quantity));
        lines.push({
          productId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantity,
        });
      }

      const deliveryFee = subtotal.gte(FREE_DELIVERY_THRESHOLD)
        ? new Prisma.Decimal(0)
        : new Prisma.Decimal(DELIVERY_FEE);

      return tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: userId ?? null,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          customerEmail: dto.customerEmail ?? null,
          deliveryAddress: dto.deliveryAddress,
          deliveryCity: dto.deliveryCity,
          notes: dto.notes ?? null,
          subtotal,
          deliveryFee,
          total: subtotal.add(deliveryFee),
          paymentMethod: dto.paymentMethod,
          items: { create: lines },
        },
        include: { items: true },
      });
    });

    const summary = {
      orderNumber: order.orderNumber,
      total: order.total,
      paymentMethod: order.paymentMethod,
    };

    if (order.paymentMethod === PaymentMethod.WHATSAPP) {
      return { order: summary, whatsappUrl: this.buildWhatsAppUrl(order) };
    }
    return { order: summary, payhere: this.payhere.buildCheckout(order) };
  }

  // Public tracking: deliberately returns NO personal data
  async track(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      select: trackingSelect,
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  findMine(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: trackingSelect,
    });
  }

  private buildWhatsAppUrl(order: OrderWithItems): string {
    const number = this.config.getOrThrow<string>('WHATSAPP_NUMBER');
    return `https://wa.me/${number}?text=${encodeURIComponent(buildWhatsAppMessage(order))}`;
  }

  // ================= Admin =================

  async adminList(query: QueryOrdersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 15;

    const where: Prisma.OrderWhereInput = {};
    if (query.status) where.orderStatus = query.status;
    if (query.paymentMethod) where.paymentMethod = query.paymentMethod;
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { customerName: { contains: query.search, mode: 'insensitive' } },
        { customerPhone: { contains: query.search } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { items: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async adminFindOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, paymentLogs: { orderBy: { createdAt: 'desc' } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async adminUpdate(id: number, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    if (dto.orderStatus && dto.orderStatus !== order.orderStatus) {
      if (!TRANSITIONS[order.orderStatus].includes(dto.orderStatus)) {
        throw new BadRequestException(`Cannot change an order from ${order.orderStatus} to ${dto.orderStatus}`);
      }
      if (dto.orderStatus === OrderStatus.CANCELLED) {
        await this.cancelAndRestock(id);
      } else {
        await this.prisma.order.update({ where: { id }, data: { orderStatus: dto.orderStatus } });
      }
    }

    if (dto.paymentStatus && dto.paymentStatus !== order.paymentStatus) {
      if (order.paymentMethod === PaymentMethod.PAYHERE) {
        throw new BadRequestException('PayHere payments are updated automatically and cannot be edited');
      }
      await this.prisma.order.update({ where: { id }, data: { paymentStatus: dto.paymentStatus } });
    }

    return this.adminFindOne(id);
  }

  // Cancels an order and puts its items back in stock. Safe to call twice.
  async cancelAndRestock(orderId: number): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: { id: orderId, orderStatus: { not: OrderStatus.CANCELLED } },
        data: { orderStatus: OrderStatus.CANCELLED },
      });
      if (result.count === 0) return false; // already cancelled

      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
      return true;
    });
  }

  async stats() {
    // "Today" in Sri Lanka time (UTC+5:30), whatever timezone the server uses
    const offset = 5.5 * 60 * 60 * 1000;
    const dayMs = 24 * 60 * 60 * 1000;
    const startOfToday = new Date(Math.floor((Date.now() + offset) / dayMs) * dayMs - offset);

    const [ordersToday, revenue, pendingOrders, totalProducts, lowStock] = await Promise.all([
      this.prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: startOfToday }, paymentStatus: PaymentStatus.PAID },
      }),
      this.prisma.order.count({ where: { orderStatus: OrderStatus.PENDING } }),
      this.prisma.product.count(),
      this.prisma.product.findMany({
        where: { stock: { lte: 5 } },
        orderBy: { stock: 'asc' },
        take: 10,
        select: { id: true, name: true, stock: true },
      }),
    ]);

    return {
      ordersToday,
      revenueToday: revenue._sum.total ?? 0,
      pendingOrders,
      totalProducts,
      lowStock,
    };
  }
}