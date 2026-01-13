import { Injectable } from '@nestjs/common';
import { Redemption } from '../entities/redemption.entity';

@Injectable()
export class RedemptionRepository {
  // Map: userId -> Redemption[]
  private redemptionsByUser: Map<string, Redemption[]> = new Map();

  constructor() {
    this.seedStubData();
  }

  findByUserId(userId: string): Redemption[] {
    return this.redemptionsByUser.get(userId) || [];
  }

  save(redemption: Redemption): void {
    const userRedemptions = this.redemptionsByUser.get(redemption.userId) || [];
    userRedemptions.push(redemption);
    this.redemptionsByUser.set(redemption.userId, userRedemptions);
  }

  private seedStubData(): void {
    // Pre-populate some redemption history per data-model.md
    this.redemptionsByUser.set('alice', [
      {
        redemptionId: 'red-a1',
        userId: 'alice',
        points: 100,
        timestamp: new Date('2025-01-20T10:00:00Z'),
      },
    ]);

    this.redemptionsByUser.set('charlie', [
      {
        redemptionId: 'red-c1',
        userId: 'charlie',
        points: 250,
        timestamp: new Date('2025-01-19T14:30:00Z'),
      },
      {
        redemptionId: 'red-c2',
        userId: 'charlie',
        points: 250,
        timestamp: new Date('2025-01-20T09:15:00Z'),
      },
    ]);

    this.redemptionsByUser.set('eve', [
      {
        redemptionId: 'red-e1',
        userId: 'eve',
        points: 25,
        timestamp: new Date('2025-01-18T12:00:00Z'),
      },
      {
        redemptionId: 'red-e2',
        userId: 'eve',
        points: 75,
        timestamp: new Date('2025-01-19T16:45:00Z'),
      },
    ]);
  }
}
