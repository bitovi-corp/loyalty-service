# Data Model: Loyalty Points API Service

**Feature**: 001-loyalty-api  
**Date**: 2025-01-21  
**Storage**: In-memory (TypeScript Map structures)

## Overview

This document defines the data entities, relationships, and validation rules for the loyalty points API. Since this is a demo with NO database, all entities are TypeScript interfaces/classes stored in-memory using Map data structures.

---

## Core Entities

### 1. Order

Represents a purchase/transaction that earns loyalty points for a user.

**Interface:**
```typescript
interface Order {
  orderId: string;       // Unique order identifier (e.g., 'ord-alice-1')
  userId: string;        // User who placed the order (e.g., 'alice')
  points: number;        // Points earned from this order (integer, >= 0)
  status: OrderStatus;   // Order state: 'active' | 'cancelled' | 'refunded'
}

type OrderStatus = 'active' | 'cancelled' | 'refunded';
```

**Validation Rules:**
- `orderId`: Required, non-empty string, must be unique across all orders
- `userId`: Required, non-empty string
- `points`: Required, integer >= 0 (no negative or fractional points)
- `status`: Required, must be one of: 'active', 'cancelled', 'refunded'

**Business Rules:**
- Only orders with `status === 'active'` contribute to earned points balance (FR-019, FR-020)
- Orders with `status === 'cancelled'` or `status === 'refunded'` are excluded from balance calculation
- Orders are immutable once created (no updates to points or userId)
- Order points value is pre-calculated by external systems (not calculated by loyalty service)

**Relationships:**
- Belongs to one User (via `userId`)
- One User can have many Orders (one-to-many)

---

### 2. Redemption

Represents a single instance of a user redeeming loyalty points.

**Interface:**
```typescript
interface Redemption {
  redemptionId: string;  // Unique redemption identifier (UUID v4)
  userId: string;        // User who redeemed points (e.g., 'alice')
  points: number;        // Points redeemed (integer, > 0)
  timestamp: Date;       // When redemption occurred (ISO 8601 datetime)
}
```

**Validation Rules:**
- `redemptionId`: Required, non-empty string, must be unique across all redemptions
- `userId`: Required, non-empty string, must reference existing user
- `points`: Required, integer > 0 (FR-010: prevent zero or negative redemptions)
- `timestamp`: Required, valid Date object

**Business Rules:**
- Points redeemed cannot exceed available balance (FR-006, FR-007)
- Available balance = SUM(active orders.points) - SUM(redemptions.points)
- Redemptions are immutable once created (audit trail requirement)
- Redemption amount must be whole numbers (no fractional points per assumption)
- Concurrent redemptions for same user are serialized to prevent race conditions

**Relationships:**
- Belongs to one User (via `userId`)
- One User can have many Redemptions (one-to-many)

---

### 3. User

Represents a loyalty program participant (implicit entity, not stored).

**Concept:**
```typescript
type UserId = string;  // User identifier (e.g., 'alice', 'bob', 'charlie')
```

**Validation Rules:**
- `userId`: Non-empty string
- No user profile data stored in loyalty service (out of scope per assumptions)

**Business Rules:**
- User existence determined by presence in order/redemption data or stub data
- No explicit user registration in loyalty service (handled by external user service)
- Users are identified by immutable string identifiers

**Relationships:**
- Has many Orders (one-to-many)
- Has many Redemptions (one-to-many)

---

### 4. LoyaltyBalance (Derived/Calculated)

Represents the current available loyalty points for a user (NOT stored, calculated on-demand).

**Interface:**
```typescript
interface LoyaltyBalance {
  userId: string;        // User identifier
  balance: number;       // Available points (earned - redeemed)
  earnedPoints: number;  // Total points from active orders
  redeemedPoints: number; // Total points from redemptions
}
```

**Calculation Logic:**
```typescript
function calculateBalance(userId: string): LoyaltyBalance {
  // Get all orders for user
  const orders = orderRepository.findByUserId(userId);
  
  // Get all redemptions for user
  const redemptions = redemptionRepository.findByUserId(userId);
  
  // Calculate earned points (only active orders)
  const earnedPoints = orders
    .filter(order => order.status === 'active')
    .reduce((sum, order) => sum + order.points, 0);
  
  // Calculate redeemed points
  const redeemedPoints = redemptions
    .reduce((sum, redemption) => sum + redemption.points, 0);
  
  // Calculate available balance
  const balance = earnedPoints - redeemedPoints;
  
  return {
    userId,
    balance,
    earnedPoints,
    redeemedPoints
  };
}
```

**Business Rules:**
- Balance is ALWAYS calculated in real-time (FR-002, constraint: no cached balances)
- Balance cannot be negative (enforced by redemption validation)
- Derived from immutable event history (orders + redemptions) per Constitution Principle IV

---

## Entity Relationships

```
User (implicit)
  ├── 1:N → Orders
  └── 1:N → Redemptions

LoyaltyBalance (derived)
  ← calculated from Orders + Redemptions
```

**Cardinality:**
- One User → Many Orders (0..*)
- One User → Many Redemptions (0..*)
- One LoyaltyBalance ← One User (1:1, calculated)

---

## Storage Implementation (In-Memory)

### OrderRepository

```typescript
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
    // Hardcoded stub data from research.md
    this.ordersByUser.set('alice', [
      { orderId: 'ord-a1', userId: 'alice', points: 100, status: 'active' },
      { orderId: 'ord-a2', userId: 'alice', points: 150, status: 'active' },
      { orderId: 'ord-a3', userId: 'alice', points: 50, status: 'active' }
    ]);
    
    this.ordersByUser.set('bob', []);
    
    this.ordersByUser.set('charlie', [
      { orderId: 'ord-c1', userId: 'charlie', points: 500, status: 'active' }
    ]);
    
    this.ordersByUser.set('dave', [
      { orderId: 'ord-d1', userId: 'dave', points: 200, status: 'active' },
      { orderId: 'ord-d2', userId: 'dave', points: 100, status: 'cancelled' }
    ]);
    
    this.ordersByUser.set('eve', [
      { orderId: 'ord-e1', userId: 'eve', points: 50, status: 'active' },
      { orderId: 'ord-e2', userId: 'eve', points: 50, status: 'active' },
      { orderId: 'ord-e3', userId: 'eve', points: 50, status: 'active' },
      { orderId: 'ord-e4', userId: 'eve', points: 50, status: 'active' },
      { orderId: 'ord-e5', userId: 'eve', points: 50, status: 'active' }
    ]);
  }
}
```

### RedemptionRepository

```typescript
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
    // Pre-populate some redemption history
    this.redemptionsByUser.set('alice', [
      { 
        redemptionId: 'red-a1', 
        userId: 'alice', 
        points: 100, 
        timestamp: new Date('2025-01-20T10:00:00Z') 
      }
    ]);
    
    this.redemptionsByUser.set('charlie', [
      { 
        redemptionId: 'red-c1', 
        userId: 'charlie', 
        points: 250, 
        timestamp: new Date('2025-01-19T14:30:00Z') 
      },
      { 
        redemptionId: 'red-c2', 
        userId: 'charlie', 
        points: 250, 
        timestamp: new Date('2025-01-20T09:15:00Z') 
      }
    ]);
    
    this.redemptionsByUser.set('eve', [
      { 
        redemptionId: 'red-e1', 
        userId: 'eve', 
        points: 25, 
        timestamp: new Date('2025-01-18T12:00:00Z') 
      },
      { 
        redemptionId: 'red-e2', 
        userId: 'eve', 
        points: 75, 
        timestamp: new Date('2025-01-19T16:45:00Z') 
      }
    ]);
  }
}
```

---

## Validation & Constraints

### Cross-Entity Constraints

**Redemption Validation:**
```typescript
// Before creating redemption, validate:
// 1. User exists (has orders)
if (!orderRepository.userExists(userId)) {
  throw new NotFoundException(`User ${userId} not found`);
}

// 2. Sufficient balance
const balance = calculateBalance(userId);
if (balance.balance < requestedPoints) {
  throw new ConflictException(
    `Insufficient points. Available: ${balance.balance}, Requested: ${requestedPoints}`
  );
}

// 3. Positive redemption amount
if (requestedPoints <= 0) {
  throw new BadRequestException('Redemption amount must be positive');
}
```

### Data Integrity

**Immutability:**
- Orders: Once created, never modified (no update/delete operations)
- Redemptions: Once created, never modified (audit trail requirement)
- Balance: Always calculated from immutable source data

**Concurrency Safety:**
- Redemption operations use per-user mutex lock
- Prevents race conditions between concurrent requests for same user
- Ensures atomic read-validate-write for redemptions

---

## Test Data Scenarios

### Stub Data Coverage

| User | Orders (Active) | Redemptions | Balance | Scenario |
|------|----------------|-------------|---------|----------|
| alice | 3 orders, 300 pts | 1 redemption, 100 pts | 200 | Normal user with activity |
| bob | 0 orders | 0 redemptions | 0 | New user, no activity |
| charlie | 1 order, 500 pts | 2 redemptions, 500 pts | 0 | Fully redeemed points |
| dave | 1 active (200 pts)<br>1 cancelled (100 pts) | 0 redemptions | 200 | Tests cancelled order handling |
| eve | 5 orders, 250 pts | 2 redemptions, 100 pts | 150 | Multiple redemptions for history |

**Acceptance Scenario Coverage:**
- ✅ AS1.1: alice (300 earned, 100 redeemed → 200 balance)
- ✅ AS1.2: bob (0 earned, 0 redeemed → 0 balance)
- ✅ AS1.3: charlie (500 earned, 500 redeemed → 0 balance)
- ✅ AS1.5: dave (cancelled order excluded from balance)
- ✅ AS3.1: eve (multiple redemptions for history endpoint)

---

## Migration Notes (Future Database)

When migrating from in-memory to persistent storage:

**Table Schema (PostgreSQL example):**

```sql
-- Orders table
CREATE TABLE orders (
  order_id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  points INTEGER NOT NULL CHECK (points >= 0),
  status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'cancelled', 'refunded')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_user_id (user_id)
);

-- Redemptions table
CREATE TABLE redemptions (
  redemption_id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  points INTEGER NOT NULL CHECK (points > 0),
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_user_id (user_id)
);
```

**Changes Required:**
1. Replace Map-based repositories with database queries
2. Add transaction support for atomic redemption operations
3. Add database connection management (e.g., Prisma, TypeORM)
4. Update seeding to use database migrations/fixtures
5. Add indexes on `user_id` for query performance

**No Application Logic Changes:**
- Service layer business logic remains identical
- Balance calculation formula unchanged
- Validation rules stay the same
- API contracts unchanged

This demonstrates the value of the repository pattern abstraction!

---

## Summary

**Entity Count:** 3 stored (Order, Redemption, User-implicit), 1 derived (LoyaltyBalance)  
**Relationships:** Simple one-to-many (User→Orders, User→Redemptions)  
**Storage:** In-memory Map structures with hardcoded stub data  
**Validation:** class-validator DTOs + business logic in service layer  
**Integrity:** Immutable events, real-time calculation, per-user mutex for redemptions  

**Status:** ✅ Data model complete and aligned with spec requirements
