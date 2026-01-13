import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { OrderRepository } from './repositories/order.repository';
import { RedemptionRepository } from './repositories/redemption.repository';
import { BalanceResponseDto } from './dto/balance-response.dto';
import { RedemptionResponseDto } from './dto/redemption-response.dto';

@Injectable()
export class LoyaltyService {
  // Per-user mutex for concurrency control per research.md Decision 3
  private activeLocks: Map<string, Promise<void>> = new Map();

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly redemptionRepository: RedemptionRepository,
  ) {}

  /**
   * Calculate available balance for a user
   * Balance = SUM(active orders.points) - SUM(redemptions.points)
   */
  calculateBalance(userId: string): {
    earnedPoints: number;
    redeemedPoints: number;
    balance: number;
  } {
    const orders = this.orderRepository.findByUserId(userId);
    const redemptions = this.redemptionRepository.findByUserId(userId);

    // Only count ACTIVE orders per data-model.md
    const earnedPoints = orders
      .filter((order) => order.status === 'active')
      .reduce((sum, order) => sum + order.points, 0);

    const redeemedPoints = redemptions.reduce(
      (sum, redemption) => sum + redemption.points,
      0,
    );

    const balance = earnedPoints - redeemedPoints;

    return { earnedPoints, redeemedPoints, balance };
  }

  /**
   * Get loyalty balance for a user
   */
  getBalance(userId: string): BalanceResponseDto {
    // Validate user exists per research.md Decision 7
    if (!this.orderRepository.userExists(userId)) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const { earnedPoints, redeemedPoints, balance } =
      this.calculateBalance(userId);

    return {
      userId,
      balance,
      earnedPoints,
      redeemedPoints,
    };
  }

  /**
   * Redeem loyalty points for a user
   * Validates sufficient balance and uses mutex for concurrency safety
   */
  async redeemPoints(
    userId: string,
    points: number,
  ): Promise<RedemptionResponseDto> {
    // Wait for any pending operation on this user (per-user mutex)
    const existingLock = this.activeLocks.get(userId);
    if (existingLock) {
      await existingLock.catch(() => {}); // Ignore errors from previous operations
    }

    // Create a new lock for this operation
    let lockResolve: () => void = () => {};
    const lockPromise = new Promise<void>((resolve) => {
      lockResolve = resolve;
    });
    this.activeLocks.set(userId, lockPromise);

    try {
      const result = this.executeRedemption(userId, points);
      return result;
    } finally {
      lockResolve(); // Always release lock
      this.activeLocks.delete(userId);
    }
  }

  /**
   * Execute the actual redemption (internal method)
   */
  private executeRedemption(
    userId: string,
    points: number,
  ): RedemptionResponseDto {
    // Validate positive points per research.md Decision 7
    if (points <= 0) {
      throw new BadRequestException('Redemption amount must be positive');
    }

    // Validate user exists
    if (!this.orderRepository.userExists(userId)) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Calculate current balance
    const { balance } = this.calculateBalance(userId);

    // Validate sufficient points
    if (balance < points) {
      throw new ConflictException(
        `Insufficient points. Available: ${balance}, Requested: ${points}`,
      );
    }

    // Create redemption record
    const redemption = {
      redemptionId: uuidv4(),
      userId,
      points,
      timestamp: new Date(),
    };

    // Save redemption
    this.redemptionRepository.save(redemption);

    // Calculate new balance
    const newBalance = balance - points;

    // Return response
    return {
      redemptionId: redemption.redemptionId,
      userId: redemption.userId,
      points: redemption.points,
      timestamp: redemption.timestamp.toISOString(),
      newBalance,
    };
  }

  /**
   * Get redemption history for a user
   * Returns redemptions sorted by timestamp (newest first)
   */
  getRedemptionHistory(userId: string) {
    // Validate user exists
    if (!this.orderRepository.userExists(userId)) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Get redemptions
    const redemptions = this.redemptionRepository.findByUserId(userId);

    // Sort by timestamp descending (newest first) per spec.md FR-016
    const sortedRedemptions = redemptions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .map((r) => ({
        redemptionId: r.redemptionId,
        userId: r.userId,
        points: r.points,
        timestamp: r.timestamp.toISOString(),
      }));

    return {
      userId,
      redemptions: sortedRedemptions,
    };
  }
}
