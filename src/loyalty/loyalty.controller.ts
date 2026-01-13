import { Controller, Get, Post, Param, Body, HttpCode } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { BalanceResponseDto } from './dto/balance-response.dto';
import { RedeemRequestDto } from './dto/redeem-request.dto';
import { RedemptionResponseDto } from './dto/redemption-response.dto';
import { RedemptionHistoryResponseDto } from './dto/redemption-history.dto';

@Controller('loyalty/:userId')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  /**
   * GET /loyalty/:userId/balance
   * Get loyalty points balance for a user
   */
  @Get('balance')
  getBalance(@Param('userId') userId: string): BalanceResponseDto {
    return this.loyaltyService.getBalance(userId);
  }

  /**
   * POST /loyalty/:userId/redeem
   * Redeem loyalty points for a user
   */
  @Post('redeem')
  @HttpCode(201)
  async redeemPoints(
    @Param('userId') userId: string,
    @Body() redeemRequest: RedeemRequestDto,
  ): Promise<RedemptionResponseDto> {
    return this.loyaltyService.redeemPoints(userId, redeemRequest.points);
  }

  /**
   * GET /loyalty/:userId/redemptions
   * Get redemption history for a user
   */
  @Get('redemptions')
  getRedemptionHistory(
    @Param('userId') userId: string,
  ): RedemptionHistoryResponseDto {
    return this.loyaltyService.getRedemptionHistory(userId);
  }
}
