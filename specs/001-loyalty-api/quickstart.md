# Quickstart Guide: Loyalty Points API

**Feature**: 001-loyalty-api  
**Date**: 2025-01-21  

## Overview

This guide helps you get the Loyalty Points API running locally and demonstrates the core functionality through example API calls.

---

## Prerequisites

- **Node.js**: 20.x LTS or later
- **npm**: 10.x or later (comes with Node.js)
- **Git**: For cloning the repository

---

## Installation

### 1. Clone Repository (if not already done)

```bash
git clone <repository-url>
cd loyalty-service
```

### 2. Checkout Feature Branch

```bash
git checkout 001-loyalty-api
```

### 3. Install Dependencies

```bash
npm install
```

This will install:
- NestJS framework (@nestjs/core, @nestjs/common, @nestjs/platform-express)
- Validation libraries (class-validator, class-transformer)
- Testing tools (Jest, supertest)
- TypeScript and build tools

### 4. Verify Installation

```bash
npm run build
```

Expected output: Compilation successful, `dist/` directory created

---

## Running the Service

### Development Mode (with hot-reload)

```bash
npm run start:dev
```

The API will start on `http://localhost:3000`

You should see output like:
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
[Nest] INFO [InstanceLoader] LoyaltyModule dependencies initialized
[Nest] INFO [RoutesResolver] LoyaltyController {/loyalty/:userId}:
[Nest] INFO [RouterExplorer] Mapped {/loyalty/:userId/balance, GET} route
[Nest] INFO [RouterExplorer] Mapped {/loyalty/:userId/redeem, POST} route
[Nest] INFO [RouterExplorer] Mapped {/loyalty/:userId/redemptions, GET} route
[Nest] INFO [NestApplication] Nest application successfully started
```

### Production Mode

```bash
npm run build
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

Debug server listens on port 9229 for debugger attachment.

---

## API Endpoints

Base URL: `http://localhost:3000`

### 1. Get Loyalty Points Balance

**Endpoint**: `GET /loyalty/{userId}/balance`

**Example Request**:
```bash
curl http://localhost:3000/loyalty/alice/balance
```

**Example Response**:
```json
{
  "userId": "alice",
  "balance": 200,
  "earnedPoints": 300,
  "redeemedPoints": 100
}
```

**Try Other Users**:
```bash
# User with no orders
curl http://localhost:3000/loyalty/bob/balance

# User with fully redeemed points
curl http://localhost:3000/loyalty/charlie/balance

# User with cancelled order
curl http://localhost:3000/loyalty/dave/balance
```

---

### 2. Redeem Loyalty Points

**Endpoint**: `POST /loyalty/{userId}/redeem`

**Example Request**:
```bash
curl -X POST http://localhost:3000/loyalty/alice/redeem \
  -H "Content-Type: application/json" \
  -d '{"points": 50}'
```

**Example Response** (201 Created):
```json
{
  "redemptionId": "123e4567-e89b-12d3-a456-426614174000",
  "userId": "alice",
  "points": 50,
  "timestamp": "2025-01-21T10:30:00.000Z",
  "newBalance": 150
}
```

**Error Example - Insufficient Points** (409 Conflict):
```bash
curl -X POST http://localhost:3000/loyalty/bob/redeem \
  -H "Content-Type: application/json" \
  -d '{"points": 100}'
```

Response:
```json
{
  "statusCode": 409,
  "message": "Insufficient points. Available: 0, Requested: 100",
  "error": "Conflict"
}
```

**Error Example - Validation Failure** (400 Bad Request):
```bash
curl -X POST http://localhost:3000/loyalty/alice/redeem \
  -H "Content-Type: application/json" \
  -d '{"points": -50}'
```

Response:
```json
{
  "statusCode": 400,
  "message": ["points must be a positive number"],
  "error": "Bad Request"
}
```

---

### 3. Get Redemption History

**Endpoint**: `GET /loyalty/{userId}/redemptions`

**Example Request**:
```bash
curl http://localhost:3000/loyalty/eve/redemptions
```

**Example Response**:
```json
{
  "userId": "eve",
  "redemptions": [
    {
      "redemptionId": "red-e2",
      "userId": "eve",
      "points": 75,
      "timestamp": "2025-01-19T16:45:00.000Z"
    },
    {
      "redemptionId": "red-e1",
      "userId": "eve",
      "points": 25,
      "timestamp": "2025-01-18T12:00:00.000Z"
    }
  ]
}
```

**User with No Redemptions**:
```bash
curl http://localhost:3000/loyalty/bob/redemptions
```

Response:
```json
{
  "userId": "bob",
  "redemptions": []
}
```

---

## Testing

### Run All Tests

```bash
npm test
```

This runs all unit tests (*.spec.ts files).

### Run E2E Tests

```bash
npm run test:e2e
```

This runs end-to-end API tests with a test server.

### Run Tests with Coverage

```bash
npm run test:cov
```

Coverage report generated in `coverage/` directory.

### Watch Mode (for TDD)

```bash
npm run test:watch
```

Tests re-run automatically on file changes.

---

## Stub Data Reference

The service comes with pre-seeded stub data for testing:

| User ID | Orders (Active Points) | Redemptions | Current Balance | Use Case |
|---------|------------------------|-------------|-----------------|----------|
| `alice` | 3 orders (300 pts) | 1 (100 pts) | 200 pts | Normal user with activity |
| `bob` | 0 orders | 0 | 0 pts | New user, no activity |
| `charlie` | 1 order (500 pts) | 2 (500 pts total) | 0 pts | Fully redeemed |
| `dave` | 1 active (200 pts)<br>1 cancelled (100 pts) | 0 | 200 pts | Cancelled order test |
| `eve` | 5 orders (250 pts) | 2 (100 pts total) | 150 pts | Multiple redemptions |

### Detailed Stub Data

**alice's orders**:
- `ord-a1`: 100 points (active)
- `ord-a2`: 150 points (active)
- `ord-a3`: 50 points (active)
- **Total earned**: 300 points

**alice's redemptions**:
- `red-a1`: 100 points on 2025-01-20

**alice's balance**: 300 - 100 = **200 points**

---

## Common Scenarios

### Scenario 1: Check Balance and Redeem Points

```bash
# Step 1: Check alice's balance
curl http://localhost:3000/loyalty/alice/balance
# Response: balance = 200

# Step 2: Redeem 50 points
curl -X POST http://localhost:3000/loyalty/alice/redeem \
  -H "Content-Type: application/json" \
  -d '{"points": 50}'
# Response: newBalance = 150

# Step 3: Verify new balance
curl http://localhost:3000/loyalty/alice/balance
# Response: balance = 150

# Step 4: Check redemption history
curl http://localhost:3000/loyalty/alice/redemptions
# Response: 2 redemptions (original + new one)
```

### Scenario 2: Attempt Invalid Redemption

```bash
# Try to redeem more than available (alice has 200)
curl -X POST http://localhost:3000/loyalty/alice/redeem \
  -H "Content-Type: application/json" \
  -d '{"points": 300}'
# Response: 409 Conflict - Insufficient points
```

### Scenario 3: Cancelled Order Handling

```bash
# dave has 1 active order (200 pts) and 1 cancelled (100 pts)
# Only active orders count toward balance
curl http://localhost:3000/loyalty/dave/balance
# Response: balance = 200 (cancelled order excluded)
```

---

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

**Option 1**: Stop the other process using port 3000

**Option 2**: Change the port in `src/main.ts`:
```typescript
await app.listen(3001); // Change to available port
```

### TypeScript Compilation Errors

Ensure you're using TypeScript 5.7+:
```bash
npx tsc --version
```

Re-install dependencies if needed:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Tests Failing

Make sure you're on the correct branch:
```bash
git branch
# Should show: * 001-loyalty-api
```

Clear build cache:
```bash
rm -rf dist
npm run build
npm test
```

---

## Architecture Overview

### Module Structure

```
src/loyalty/
├── loyalty.module.ts           # Module definition
├── loyalty.controller.ts       # HTTP endpoints
├── loyalty.service.ts          # Business logic
├── dto/                        # Request/Response DTOs
├── entities/                   # Data models
└── repositories/               # In-memory data storage
```

### Request Flow

```
HTTP Request
    ↓
Controller (validates DTO)
    ↓
Service (business logic)
    ↓
Repository (data access)
    ↓
In-Memory Map
```

### Key Components

- **LoyaltyController**: Handles HTTP routing and DTO validation
- **LoyaltyService**: Implements balance calculation, redemption logic, concurrency control
- **OrderRepository**: In-memory storage for orders (stub data)
- **RedemptionRepository**: In-memory storage for redemptions (append-only)

---

## Next Steps

### Development Workflow

1. **Read the feature spec**: `specs/001-loyalty-api/spec.md`
2. **Review data model**: `specs/001-loyalty-api/data-model.md`
3. **Check API contract**: `specs/001-loyalty-api/contracts/openapi.yaml`
4. **Follow TDD**: Write tests first, then implement
5. **Run tests frequently**: `npm run test:watch`

### Implementation Tasks

Tasks are defined in `specs/001-loyalty-api/tasks.md` (generated separately by `/speckit.tasks` command).

### Code Style

Linting and formatting:
```bash
npm run lint          # Check for lint errors
npm run format        # Format code with Prettier
```

---

## Additional Resources

- **NestJS Documentation**: https://docs.nestjs.com/
- **OpenAPI Spec**: `specs/001-loyalty-api/contracts/openapi.yaml`
- **Constitution**: `.specify/memory/constitution.md` (project principles)
- **Feature Spec**: `specs/001-loyalty-api/spec.md`

---

## Support

For questions or issues:
1. Check the [feature spec](./spec.md) for requirements clarification
2. Review [research decisions](./research.md) for technical context
3. Consult the [data model](./data-model.md) for entity definitions

---

**Status**: ✅ Service ready for development  
**Branch**: `001-loyalty-api`  
**Last Updated**: 2025-01-21
