import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { AuthenticatedRequest, OptionalAuthRequest } from '../auth/types';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  // Guests and logged-in customers can order. Rate limited to stop spam.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  create(@Body() dto: CreateOrderDto, @Req() req: OptionalAuthRequest) {
    return this.orders.create(dto, req.user?.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  myOrders(@Req() req: AuthenticatedRequest) {
    return this.orders.findMine(req.user.sub);
  }

  @Get('track/:orderNumber')
  track(@Param('orderNumber') orderNumber: string) {
    return this.orders.track(orderNumber);
  }
}