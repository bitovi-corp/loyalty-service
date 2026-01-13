import { Injectable } from '@nestjs/common';
import { Order } from '../entities/order.entity';

@Injectable()
export class OrderRepository {
  // Map: userId -> Order[]
  private ordersByUser: Map<string, Order[]> = new Map();

  constructor() {
    this.seedStubData();
  }

  findByUserId(userId: string): Order[] {
    return this.ordersByUser.get(userId) || [];
  }

  userExists(userId: string): boolean {
    return this.ordersByUser.has(userId);
  }

  private seedStubData(): void {
    // Stub data from data-model.md
    this.ordersByUser.set('alice', [
      { orderId: 'ord-a1', userId: 'alice', points: 100, status: 'active' },
      { orderId: 'ord-a2', userId: 'alice', points: 150, status: 'active' },
      { orderId: 'ord-a3', userId: 'alice', points: 50, status: 'active' },
    ]);

    this.ordersByUser.set('bob', []);

    this.ordersByUser.set('charlie', [
      { orderId: 'ord-c1', userId: 'charlie', points: 500, status: 'active' },
    ]);

    this.ordersByUser.set('dave', [
      { orderId: 'ord-d1', userId: 'dave', points: 200, status: 'active' },
      { orderId: 'ord-d2', userId: 'dave', points: 100, status: 'cancelled' },
    ]);

    this.ordersByUser.set('eve', [
      { orderId: 'ord-e1', userId: 'eve', points: 50, status: 'active' },
      { orderId: 'ord-e2', userId: 'eve', points: 50, status: 'active' },
      { orderId: 'ord-e3', userId: 'eve', points: 50, status: 'active' },
      { orderId: 'ord-e4', userId: 'eve', points: 50, status: 'active' },
      { orderId: 'ord-e5', userId: 'eve', points: 50, status: 'active' },
    ]);
  }
}
