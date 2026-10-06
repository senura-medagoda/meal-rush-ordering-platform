import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PayhereService } from './payhere.service';

@Module({
  controllers: [PaymentsController],
  providers: [PayhereService, PaymentsService],
  exports: [PayhereService],
})
export class PaymentsModule {}