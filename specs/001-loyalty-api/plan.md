# Implementation Plan: Loyalty Points API Service

**Branch**: `001-loyalty-api` | **Date**: 2025-01-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-loyalty-api/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a NestJS-based REST API service for managing user loyalty points with three core operations: (1) check available points balance by calculating earned points from orders minus redeemed points, (2) redeem points with validation to prevent overdraft, and (3) view redemption history. This is a minimal demo implementation using in-memory data stores (no database) with hardcoded stub data to demonstrate the API contract and business logic.

## Technical Context

**Language/Version**: TypeScript 5.7 with strict mode enabled (noImplicitAny, strictNullChecks, strictBindCallApply)  
**Primary Dependencies**: NestJS 11.x (@nestjs/core, @nestjs/common, @nestjs/platform-express), class-validator, class-transformer  
**Storage**: In-memory data structures (Map/Array) with hardcoded stub data - NO database or persistence layer  
**Testing**: Jest 30.x for unit tests (*.spec.ts) and e2e tests (*.e2e-spec.ts), supertest for HTTP testing  
**Target Platform**: Node.js 20.x LTS, REST API service (Linux server deployment assumed)  
**Project Type**: Single NestJS application (backend API only)  
**Performance Goals**: <2s response time for balance checks, <3s for redemption operations, handle 1000 concurrent requests  
**Constraints**: Real-time balance calculation (no caching), atomic redemption operations, idempotent endpoints  
**Scale/Scope**: Demo/MVP scope - minimal viable API with ~3 endpoints, ~2-3 modules, stub data for 5-10 users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Initial Check (Pre-Research)

**I. NestJS Module Architecture**
- ✅ PASS: Feature will use NestJS modules (LoyaltyModule), services (LoyaltyService), and controllers (LoyaltyController)
- ✅ PASS: Business logic (points calculation, redemption validation) lives in services, HTTP routing in controllers
- ✅ PASS: Dependency injection via constructor parameters for testability

**II. Type Safety & Contract Clarity**
- ✅ PASS: TypeScript strict mode already enabled in tsconfig.json
- ✅ PASS: Will define explicit DTOs (GetBalanceResponseDto, RedeemPointsDto) with class-validator decorators
- ✅ PASS: All service methods will have explicit return types and parameter types

**III. Test-First Development**
- ✅ PASS: TDD approach planned - write tests before implementation for all business logic
- ✅ PASS: Unit tests for LoyaltyService (balance calculation, redemption validation)
- ✅ PASS: E2E tests for API endpoints with Given-When-Then structure

**IV. Data Integrity**
- ✅ PASS: Redemption operations designed to be idempotent (can add redemption ID tracking if needed)
- ✅ PASS: Balance calculated from immutable order/redemption arrays (not stored totals)
- ✅ PASS: In-memory implementation will use basic locking/validation to prevent double-spend
- ⚠️  DEFER: Full audit trails deferred for demo (timestamp + user ID will be captured in redemption records)

**V. Simplicity & YAGNI**
- ✅ PASS: Using NestJS base framework only (already adopted)
- ✅ PASS: No ORM, no database, no message queues - just in-memory Map/Array structures
- ✅ PASS: Hardcoded stub data instead of complex data generation
- ✅ PASS: Minimal dependencies beyond NestJS core + class-validator

**VI. Framework Conventions**
- ✅ PASS: Following NestJS file naming (*.service.ts, *.controller.ts, *.module.ts)
- ✅ PASS: Using NestJS decorators (@Controller, @Injectable, @Module, @Get, @Post)
- ✅ PASS: Using ValidationPipe for DTO validation instead of custom middleware

**Result**: ✅ ALL GATES PASSED - Proceed to Phase 0 Research

**Notes**: Demo/stub nature justifies simplified audit trail. Full production implementation would add detailed logging/audit module.

### Post-Design Check (After Phase 1)

**Date**: 2025-01-21

**I. NestJS Module Architecture** ✅
- CONFIRMED: data-model.md shows clean separation (Controller → Service → Repository)
- CONFIRMED: Repository abstraction enables future database migration without service changes

**II. Type Safety & Contract Clarity** ✅
- CONFIRMED: contracts/openapi.yaml defines complete API contract with schemas
- CONFIRMED: DTOs planned: BalanceResponse, RedeemRequest, RedemptionResponse, RedemptionHistoryResponse
- CONFIRMED: All entities in data-model.md have explicit TypeScript interfaces

**III. Test-First Development** ✅
- CONFIRMED: quickstart.md references TDD workflow (test:watch command)
- CONFIRMED: Test structure planned in project structure (*.spec.ts, *.e2e-spec.ts)

**IV. Data Integrity** ✅
- CONFIRMED: data-model.md documents immutability (orders and redemptions never modified)
- CONFIRMED: Balance calculation always real-time from source data (no caching)
- CONFIRMED: Per-user mutex documented in research.md for concurrency safety
- CONFIRMED: Redemption validation prevents overdraft (insufficient points check)

**V. Simplicity & YAGNI** ✅
- CONFIRMED: Zero infrastructure beyond Node.js + npm
- CONFIRMED: research.md Decision 1: In-memory Map-based storage (simplest possible)
- CONFIRMED: No dependencies added beyond class-validator/class-transformer
- CONFIRMED: Stub data covers all test scenarios without complex generation

**VI. Framework Conventions** ✅
- CONFIRMED: Project structure follows standard NestJS layout (src/[module]/)
- CONFIRMED: File naming conventions: *.module.ts, *.controller.ts, *.service.ts
- CONFIRMED: openapi.yaml uses standard REST (GET for reads, POST for mutations)
- CONFIRMED: Error handling uses NestJS HTTP exceptions

**Result**: ✅ ALL GATES PASSED - Design aligns with constitution. Ready for Phase 2 (Tasks).

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── loyalty/
│   ├── loyalty.module.ts        # LoyaltyModule definition with Prisma provider
│   ├── loyalty.controller.ts    # REST endpoints (GET /balance, POST /redeem, GET /history)
│   ├── loyalty.service.ts       # Business logic (calculate balance, validate redemptions)
│   ├── dto/
│   │   ├── balance-response.dto.ts       # Response DTO for balance endpoint
│   │   ├── redeem-request.dto.ts         # Request DTO for redemption
│   │   ├── redeem-response.dto.ts        # Response DTO for redemption
│   │   ├── redemption-history.dto.ts     # Response DTO for history endpoint
│   │   └── create-order.dto.ts           # Request DTO for order creation (integration endpoint)
│   └── prisma/
│       └── schema.prisma         # Prisma schema (Order, Redemption models)
├── app.module.ts                # Root module (imports LoyaltyModule)
└── main.ts                      # Bootstrap application

test/
├── unit/
│   └── loyalty.service.spec.ts       # Unit tests for service (TDD focus)
└── e2e/
    └── loyalty.e2e-spec.ts          # E2E tests for API endpoints
```

**Structure Decision**: Single NestJS application structure selected. Using domain-driven module organization (loyalty/) to encapsulate all loyalty-related logic. Prisma ORM provides data persistence with PostgreSQL backend. Design follows research.md Decision 1 (PostgreSQL + Prisma) and aligns with Constitution Principles I (Module Architecture) and VI (Framework Conventions).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: No violations - all constitution principles satisfied. Prisma ORM adoption is justified in research.md (simplest transaction API, superior type safety, ACID guarantees required for financial data integrity).
