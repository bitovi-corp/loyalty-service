# Research: Loyalty Points API Service

**Feature**: 001-loyalty-api  
**Date**: 2025-01-21  
**Status**: Complete

## Overview

This document captures research findings and technical decisions for implementing a **minimal demo** loyalty points API service using NestJS with **in-memory storage only** (no database). This is explicitly a stub/proof-of-concept implementation per user requirements.

---

## Decision 1: Storage Strategy - In-Memory Only (Demo Constraint)

## Decision 1: Storage Strategy - In-Memory Only (Demo Constraint)

### Context
**USER REQUIREMENT**: "This is a simple demo app with NO databases - just stub everything out with hardcoded data in memory."

The service needs to store:
- Orders (userId, orderId, points, status)
- Redemptions (redemptionId, userId, points, timestamp)

### Decision: TypeScript Map-Based Repositories with Hardcoded Stub Data

**Rationale:**
- Explicit user constraint eliminates database options
- TypeScript Map provides O(1) lookups by key (userId)
- Repository pattern still provides clean abstraction (testable, follows NestJS conventions)
- Hardcoded stub data seeded in repository constructors on service startup
- Future migration to database trivial (swap repository implementation only)

**Implementation:**
```typescript
@Injectable()
export class OrderRepository {
  private ordersByUser: Map<string, Order[]> = new Map();
  
  constructor() {
    this.seedStubData();
  }
  
  findByUserId(userId: string): Order[] {
    return this.ordersByUser.get(userId) || [];
  }
  
  private seedStubData() {
    this.ordersByUser.set('alice', [
      { orderId: 'ord-1', userId: 'alice', points: 100, status: 'active' },
      { orderId: 'ord-2', userId: 'alice', points: 150, status: 'active' },
      { orderId: 'ord-3', userId: 'alice', points: 50, status: 'active' }
    ]);
    // ... more stub users
  }
}
```

**Constitution Alignment:**
- ✅ Simplicity (V): Minimal possible implementation, no infrastructure
- ✅ Module Architecture (I): Repository injectable service, separated from business logic
- ✅ YAGNI: Exactly what's needed for demo, nothing more

**Trade-offs Accepted:**
- ❌ No persistence (data lost on restart) - acceptable for demo
- ❌ No audit retention - deferred to production implementation
- ✅ Fast performance, simple testing

---

## Decision 2: Order Data Source - Stub Data in Service

---

## Decision 2: Order Data Source - Stub Data in Service

### Context
Spec assumes "order data provided by external systems." For demo, we need mock order data to calculate points.

### Decision: Hardcoded Orders in OrderRepository

**Approach:**
- All orders pre-seeded in repository constructor
- No external API calls needed
- Orders are immutable once seeded

**Stub Data Design:**
```typescript
const STUB_ORDERS = {
  'alice': [
    { orderId: 'ord-alice-1', points: 100, status: 'active' },
    { orderId: 'ord-alice-2', points: 150, status: 'active' },
    { orderId: 'ord-alice-3', points: 50, status: 'active' }
  ],
  'bob': [], // User with no orders
  'charlie': [
    { orderId: 'ord-charlie-1', points: 500, status: 'active' }
  ],
  'dave': [
    { orderId: 'ord-dave-1', points: 200, status: 'active' },
    { orderId: 'ord-dave-2', points: 100, status: 'cancelled' } // Cancelled order test case
  ]
};
```

**Rationale:**
- ✅ Simplest possible approach for demo
- ✅ Covers test scenarios from spec (no orders, some orders, cancelled orders)
- ✅ No external dependencies or network calls
- 🔮 Production would replace with REST client or event subscription

---

## Decision 3: Concurrent Redemption Safety (Demo Scope)

### Context
Constitution Principle IV requires preventing double-spend even with concurrent redemption requests.

### Decision: Simple In-Memory Mutex Per User

**Approach:**
```typescript
private activeLocks: Map<string, Promise<void>> = new Map();

async redeemPoints(userId: string, points: number): Promise<Redemption> {
  // Wait for any pending operation on this user
  const existingLock = this.activeLocks.get(userId);
  if (existingLock) {
    await existingLock;
  }
  
  // Create new lock for this operation
  const operation = this.executeRedemption(userId, points);
  this.activeLocks.set(userId, operation);
  
  try {
    const result = await operation;
    return result;
  } finally {
    this.activeLocks.delete(userId);
  }
}

private async executeRedemption(userId: string, points: number): Promise<Redemption> {
  // 1. Calculate balance
  const balance = this.calculateBalance(userId);
  
  // 2. Validate sufficient points
  if (balance < points) {
    throw new ConflictException('Insufficient points');
  }
  
  // 3. Create redemption record
  const redemption = { 
    redemptionId: uuidv4(), 
    userId, 
    points, 
    timestamp: new Date() 
  };
  this.redemptionRepository.save(redemption);
  
  return redemption;
}
```

**Rationale:**
- ✅ Prevents race conditions for same user's concurrent redemptions
- ✅ Simple promise-based locking (no external libraries)
- ✅ Adequate for demo with low concurrency
- 🔮 Production would use database transaction isolation or pessimistic row locks

**Limitation Acknowledged:**
- Only works in single Node.js process (not horizontally scalable)
- Lost if process crashes mid-redemption
- Acceptable trade-off for in-memory demo

---

## Decision 4: Cancelled/Refunded Order Handling

### Context
Spec edge case: "When a user's orders are cancelled or refunded, the points from those orders must be deducted from their available balance"

Acceptance scenario 5: "Given order is cancelled, balance reflects deduction"

### Decision: Filter Out Cancelled Orders in Balance Calculation

**Approach:**
```typescript
calculateBalance(userId: string): number {
  const orders = this.orderRepository.findByUserId(userId);
  const redemptions = this.redemptionRepository.findByUserId(userId);
  
  // Only count ACTIVE orders
  const earnedPoints = orders
    .filter(order => order.status === 'active')
    .reduce((sum, order) => sum + order.points, 0);
    
  const redeemedPoints = redemptions
    .reduce((sum, redemption) => sum + redemption.points, 0);
    
  return earnedPoints - redeemedPoints;
}
```

**Rationale:**
- ✅ Satisfies spec requirement: cancelled orders don't contribute points
- ✅ Simple filter in calculation logic
- ✅ Orders have `status` field: 'active' | 'cancelled' | 'refunded'
- ✅ No complex reversal logic or negative balance handling needed

**Stub Data Coverage:**
- Include dave with a cancelled order to test this scenario

---

## Decision 5: DTO Validation Strategy

### Context
Need to validate API request/response data per Constitution Principle II (Type Safety).

### Decision: class-validator with Global ValidationPipe

**Dependencies to Add:**
- `class-validator`
- `class-transformer`

**Implementation:**
```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // Strip unknown properties
  forbidNonWhitelisted: true, // Throw error on unknown properties
  transform: true,           // Auto-transform payloads to DTO instances
}));

// redeem-points.dto.ts
export class RedeemPointsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsPositive()
  @Min(1)
  points: number;
}
```

**Rationale:**
- ✅ NestJS standard practice (Constitution VI: Framework Conventions)
- ✅ Declarative validation rules co-located with DTOs
- ✅ Automatic 400 Bad Request responses with detailed error messages
- ✅ Type safety at compile time AND runtime

---

## Decision 6: API Endpoint Design

### Context
Need REST endpoints for three core operations from spec.

### Decision: Resource-Oriented REST with User Context

**Endpoints:**
```
GET    /loyalty/:userId/balance           # Get current points balance
POST   /loyalty/:userId/redeem            # Redeem points
GET    /loyalty/:userId/redemptions       # Get redemption history
```

**Request/Response Examples:**

```typescript
// GET /loyalty/alice/balance
Response: { userId: 'alice', balance: 200 }

// POST /loyalty/alice/redeem
Request: { points: 50 }
Response: { 
  redemptionId: '123e4567-e89b-12d3-a456-426614174000',
  userId: 'alice', 
  points: 50, 
  timestamp: '2025-01-21T10:30:00Z',
  newBalance: 150
}

// GET /loyalty/alice/redemptions
Response: {
  userId: 'alice',
  redemptions: [
    { redemptionId: '...', points: 50, timestamp: '...' },
    { redemptionId: '...', points: 25, timestamp: '...' }
  ]
}
```

**Rationale:**
- ✅ RESTful conventions (GET for reads, POST for mutations)
- ✅ User ID in path makes authorization easier in future
- ✅ Self-descriptive URLs
- ✅ Standard HTTP status codes (200 OK, 409 Conflict for insufficient points, 404 Not Found)

---

## Decision 7: Error Handling & HTTP Status Codes

### Context
Need consistent error handling for validation failures, insufficient points, missing users.

### Decision: NestJS Built-in HTTP Exceptions

**Error Mapping:**
- **400 Bad Request**: Invalid input (class-validator catches: negative points, missing fields)
- **404 Not Found**: User ID doesn't exist in stub data
- **409 Conflict**: Insufficient points for redemption
- **500 Internal Server Error**: Unexpected failures

**Implementation:**
```typescript
// Insufficient points
if (balance < points) {
  throw new ConflictException(
    `Insufficient points. Available: ${balance}, Requested: ${points}`
  );
}

// User not found
if (!this.orderRepository.userExists(userId)) {
  throw new NotFoundException(`User ${userId} not found`);
}
```

**Rationale:**
- ✅ NestJS standard exceptions (framework conventions)
- ✅ Automatic JSON error responses with message and statusCode
- ✅ Satisfies FR-014: appropriate error messages for invalid users
- ✅ Satisfies FR-007: reject insufficient points with clear message

---

## Summary of Decisions

| Decision | Choice | Key Rationale |
|----------|--------|---------------|
| **Storage** | In-memory Map with stub data | User requirement: "NO databases", demo/POC scope |
| **Order Data** | Hardcoded in repository | Simplest approach for demo, covers test scenarios |
| **Concurrency** | Promise-based mutex per user | Prevents double-spend for demo, adequate for single process |
| **Cancelled Orders** | Filter by status field | Satisfies spec requirement, simple implementation |
| **Validation** | class-validator + ValidationPipe | NestJS standard, declarative, type-safe |
| **API Design** | REST with /:userId path param | RESTful, self-descriptive, standard HTTP verbs |
| **Error Handling** | NestJS HTTP exceptions | Framework standard, clear status codes |

---

## Constitution Alignment

All decisions reviewed against constitution principles:

- ✅ **I. NestJS Module Architecture**: Repository pattern, service-based business logic
- ✅ **II. Type Safety**: class-validator DTOs, explicit types throughout
- ✅ **III. Test-First**: All patterns easily testable with Jest + mocks
- ✅ **IV. Data Integrity**: Mutex prevents double-spend, real-time balance calculation
- ✅ **V. Simplicity & YAGNI**: In-memory is simplest possible, no external dependencies
- ✅ **VI. Framework Conventions**: ValidationPipe, decorators, standard NestJS patterns

---

## Dependencies Required

### To Install
```bash
npm install class-validator class-transformer
```

### Already Available (from existing package.json)
- @nestjs/core, @nestjs/common, @nestjs/platform-express (11.x)
- TypeScript (5.7.x)
- Jest (30.x)
- supertest (7.x)

---

## Stub Data Design

### Users with Test Scenarios

```typescript
const STUB_DATA = {
  users: ['alice', 'bob', 'charlie', 'dave', 'eve'],
  
  orders: {
    'alice': [
      { orderId: 'ord-a1', points: 100, status: 'active' },
      { orderId: 'ord-a2', points: 150, status: 'active' },
      { orderId: 'ord-a3', points: 50, status: 'active' }
    ], // Total: 300 points
    
    'bob': [], // No orders → 0 points
    
    'charlie': [
      { orderId: 'ord-c1', points: 500, status: 'active' }
    ], // Total: 500 points
    
    'dave': [
      { orderId: 'ord-d1', points: 200, status: 'active' },
      { orderId: 'ord-d2', points: 100, status: 'cancelled' }
    ], // Total: 200 (cancelled order excluded)
    
    'eve': [
      { orderId: 'ord-e1', points: 50, status: 'active' },
      { orderId: 'ord-e2', points: 50, status: 'active' },
      { orderId: 'ord-e3', points: 50, status: 'active' },
      { orderId: 'ord-e4', points: 50, status: 'active' },
      { orderId: 'ord-e5', points: 50, status: 'active' }
    ] // Total: 250, for testing multiple redemptions
  },
  
  redemptions: {
    'alice': [
      { redemptionId: 'red-a1', points: 100, timestamp: '2025-01-20T10:00:00Z' }
    ], // Balance: 300 - 100 = 200
    
    'charlie': [
      { redemptionId: 'red-c1', points: 250, timestamp: '2025-01-19T14:30:00Z' },
      { redemptionId: 'red-c2', points: 250, timestamp: '2025-01-20T09:15:00Z' }
    ], // Balance: 500 - 500 = 0
    
    'eve': [
      { redemptionId: 'red-e1', points: 25, timestamp: '2025-01-18T12:00:00Z' },
      { redemptionId: 'red-e2', points: 75, timestamp: '2025-01-19T16:45:00Z' }
    ] // Balance: 250 - 100 = 150
  }
};
```

**Coverage of Acceptance Scenarios:**
- ✅ User with orders and redemptions (alice: 300 earned, 100 redeemed → 200 balance)
- ✅ User with no orders (bob: 0 earned → 0 balance)
- ✅ User with fully redeemed points (charlie: 500 earned, 500 redeemed → 0 balance)
- ✅ Cancelled order handling (dave: 200 active, 100 cancelled → 200 balance)
- ✅ Multiple redemptions for history endpoint (eve: 2 redemptions)

---

## Phase 0 Complete

**Status**: ✅ All technical decisions finalized  
**Unknowns Resolved**: All NEEDS CLARIFICATION items addressed  
**Ready for**: Phase 1 (Design & Contracts)

**Next Steps:**
1. Generate data-model.md (entities and relationships)
2. Generate OpenAPI contract for REST endpoints
3. Generate quickstart.md (how to run the demo)
4. Update agent context with technology choices
