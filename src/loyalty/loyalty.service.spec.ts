import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { OrderRepository } from './repositories/order.repository';
import { RedemptionRepository } from './repositories/redemption.repository';

describe('LoyaltyService - User Story 1: Balance Calculation', () => {
  let service: LoyaltyService;
  let orderRepository: OrderRepository;
  let redemptionRepository: RedemptionRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoyaltyService, OrderRepository, RedemptionRepository],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
    orderRepository = module.get<OrderRepository>(OrderRepository);
    redemptionRepository =
      module.get<RedemptionRepository>(RedemptionRepository);
  });

  describe('calculateBalance', () => {
    // T021: alice scenario - 300 earned, 100 redeemed = 200 balance
    it('should calculate correct balance for user with orders and redemptions', () => {
      const result = service.calculateBalance('alice');

      expect(result.earnedPoints).toBe(300); // 100 + 150 + 50
      expect(result.redeemedPoints).toBe(100);
      expect(result.balance).toBe(200);
    });

    // T022: bob scenario - no orders = 0 balance
    it('should return zero balance for user with no orders', () => {
      const result = service.calculateBalance('bob');

      expect(result.earnedPoints).toBe(0);
      expect(result.redeemedPoints).toBe(0);
      expect(result.balance).toBe(0);
    });

    // T023: charlie scenario - 500 earned, 500 redeemed = 0 balance
    it('should return zero balance for user with fully redeemed points', () => {
      const result = service.calculateBalance('charlie');

      expect(result.earnedPoints).toBe(500);
      expect(result.redeemedPoints).toBe(500); // 250 + 250
      expect(result.balance).toBe(0);
    });

    // T024: dave scenario - only active orders count (cancelled excluded)
    it('should exclude cancelled orders from balance calculation', () => {
      const result = service.calculateBalance('dave');

      // Dave has 1 active order (200 pts) and 1 cancelled (100 pts)
      // Only active should count
      expect(result.earnedPoints).toBe(200);
      expect(result.redeemedPoints).toBe(0);
      expect(result.balance).toBe(200);
    });
  });

  describe('getBalance', () => {
    it('should return balance response DTO for valid user', () => {
      const result = service.getBalance('alice');

      expect(result).toEqual({
        userId: 'alice',
        balance: 200,
        earnedPoints: 300,
        redeemedPoints: 100,
      });
    });

    it('should throw NotFoundException for non-existent user', () => {
      expect(() => service.getBalance('nonexistent')).toThrow(
        NotFoundException,
      );
      expect(() => service.getBalance('nonexistent')).toThrow(
        'User nonexistent not found',
      );
    });
  });
});

describe('LoyaltyService - User Story 2: Redemption', () => {
  let service: LoyaltyService;
  let orderRepository: OrderRepository;
  let redemptionRepository: RedemptionRepository;

  beforeEach(async () => {
    // Create fresh instances for each test to avoid state pollution
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoyaltyService, OrderRepository, RedemptionRepository],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
    orderRepository = module.get<OrderRepository>(OrderRepository);
    redemptionRepository =
      module.get<RedemptionRepository>(RedemptionRepository);
  });

  describe('redeemPoints', () => {
    // T038: Valid redemption - alice has 200 available initially
    it('should successfully redeem points when sufficient balance exists', async () => {
      // Get current balance first
      const initialBalance = service.calculateBalance('alice');
      const redeemAmount = 50; // Redeem a smaller amount

      const result = await service.redeemPoints('alice', redeemAmount);

      expect(result.userId).toBe('alice');
      expect(result.points).toBe(redeemAmount);
      expect(result.newBalance).toBe(initialBalance.balance - redeemAmount);
      expect(result.redemptionId).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });

    // T039: Insufficient points - bob has 0, try to redeem 100
    it('should throw ConflictException when insufficient points', async () => {
      await expect(service.redeemPoints('bob', 100)).rejects.toThrow(
        ConflictException,
      );
    });

    // T040: Exact balance redemption - use dave (200 available, no prior redemptions)
    it('should allow redemption of exact available balance', async () => {
      const currentBalance = service.calculateBalance('dave');
      const result = await service.redeemPoints('dave', currentBalance.balance);

      expect(result.userId).toBe('dave');
      expect(result.points).toBe(currentBalance.balance);
      expect(result.newBalance).toBe(0);
    });

    // T041: Negative/zero points validation
    it('should throw BadRequestException for zero points', async () => {
      await expect(service.redeemPoints('alice', 0)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for negative points', async () => {
      await expect(service.redeemPoints('alice', -50)).rejects.toThrow(
        BadRequestException,
      );
    });

    // T042: Concurrency safety - two redemptions serialized
    // Use a user with enough balance for two concurrent redemptions
    it('should handle concurrent redemptions for same user safely', async () => {
      // Check charlie's balance (0 after stub data), use eve instead (150 available)
      const initialBalance = service.calculateBalance('eve');

      // Eve has 150 available, redeem 50 twice concurrently
      const redemption1Promise = service.redeemPoints('eve', 50);
      const redemption2Promise = service.redeemPoints('eve', 50);

      // Both should complete without error (mutex ensures serialization)
      const results = await Promise.all([
        redemption1Promise,
        redemption2Promise,
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].points).toBe(50);
      expect(results[1].points).toBe(50);

      // Final balance should be 50 (150 - 50 - 50)
      const finalBalance = service.calculateBalance('eve');
      expect(finalBalance.balance).toBe(50);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      await expect(service.redeemPoints('nonexistent', 50)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

describe('LoyaltyService - User Story 3: Redemption History', () => {
  let service: LoyaltyService;
  let orderRepository: OrderRepository;
  let redemptionRepository: RedemptionRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoyaltyService, OrderRepository, RedemptionRepository],
    }).compile();

    service = module.get<LoyaltyService>(LoyaltyService);
    orderRepository = module.get<OrderRepository>(OrderRepository);
    redemptionRepository =
      module.get<RedemptionRepository>(RedemptionRepository);
  });

  describe('getRedemptionHistory', () => {
    // T061: user with multiple redemptions (eve has 2)
    it('should return redemptions in reverse chronological order (newest first)', () => {
      const result = service.getRedemptionHistory('eve');

      expect(result.userId).toBe('eve');
      expect(result.redemptions).toHaveLength(2);

      // Verify newest first
      expect(result.redemptions[0].points).toBe(75); // red-e2, more recent
      expect(result.redemptions[1].points).toBe(25); // red-e1, older

      // Verify timestamps are descending
      const timestamp1 = new Date(result.redemptions[0].timestamp).getTime();
      const timestamp2 = new Date(result.redemptions[1].timestamp).getTime();
      expect(timestamp1).toBeGreaterThan(timestamp2);
    });

    // T062: user with no redemptions (bob)
    it('should return empty array for user with no redemptions', () => {
      const result = service.getRedemptionHistory('bob');

      expect(result.userId).toBe('bob');
      expect(result.redemptions).toEqual([]);
    });

    // T063: verify sorting
    it('should sort redemptions by timestamp descending', () => {
      // Charlie has 2 redemptions per stub data
      const result = service.getRedemptionHistory('charlie');

      expect(result.redemptions).toHaveLength(2);

      for (let i = 0; i < result.redemptions.length - 1; i++) {
        const current = new Date(result.redemptions[i].timestamp).getTime();
        const next = new Date(result.redemptions[i + 1].timestamp).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('should throw NotFoundException for non-existent user', () => {
      expect(() => service.getRedemptionHistory('nonexistent')).toThrow(
        NotFoundException,
      );
    });
  });
});
