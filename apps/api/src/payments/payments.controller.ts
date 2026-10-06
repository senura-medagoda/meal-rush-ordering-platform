import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';

@Controller('payments/payhere')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  // PayHere's server calls this (form-encoded). It must reply 200 quickly.
  @SkipThrottle()
  @Post('notify')
  @HttpCode(200)
  async notify(@Body() body: Record<string, string>) {
    await this.payments.handleNotification(body);
    return 'OK';
  }
}