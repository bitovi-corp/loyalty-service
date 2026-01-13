import { Module } from '@nestjs/common';
import { OrderRepository } from './repositories/order.repository';
import { RedemptionRepository } from './repositories/redemption.repository';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';

@Module({
  providers: [OrderRepository, RedemptionRepository, LoyaltyService],
  controllers: [LoyaltyController],
  exports: [OrderRepository, RedemptionRepository, LoyaltyService],
})
export class LoyaltyModule {}
