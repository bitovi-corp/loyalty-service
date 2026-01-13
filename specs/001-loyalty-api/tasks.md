# Tasks: Loyalty Points API Service

**Feature Branch**: `001-loyalty-api`  
**Input**: Design documents from `/specs/001-loyalty-api/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: This implementation follows TDD approach as specified in the constitution. Tests are written BEFORE implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `- [ ] [ID] [P?] [Story] Description`

- **Checkbox**: `- [ ]` required for all tasks
- **[ID]**: Task number (T001, T002, etc.)
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic NestJS structure

- [X] T001 Create NestJS project structure with src/ and test/ directories per plan.md
- [X] T002 Initialize package.json with NestJS 11.x dependencies (@nestjs/core, @nestjs/common, @nestjs/platform-express)
- [X] T003 [P] Install validation dependencies: class-validator and class-transformer per research.md Decision 5
- [X] T004 [P] Configure TypeScript strict mode (tsconfig.json: noImplicitAny, strictNullChecks, strictBindCallApply) per plan.md
- [X] T005 [P] Configure Jest 30.x for unit and e2e tests in jest.config.js
- [X] T006 Create main.ts with NestJS bootstrap and GlobalValidationPipe configuration per research.md Decision 5
- [X] T007 Create app.module.ts as root module

**Checkpoint**: Basic NestJS project structure ready, dependencies installed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Create LoyaltyModule in src/loyalty/loyalty.module.ts with module definition
- [X] T009 [P] Create Order entity interface in src/loyalty/entities/order.entity.ts per data-model.md
- [X] T010 [P] Create Redemption entity interface in src/loyalty/entities/redemption.entity.ts per data-model.md
- [X] T011 [P] Create OrderStatus type in src/loyalty/entities/order.entity.ts (active | cancelled | refunded)
- [X] T012 Create OrderRepository with Map-based storage in src/loyalty/repositories/order.repository.ts per research.md Decision 1
- [X] T013 Implement stub data seeding for OrderRepository per data-model.md stub data (alice, bob, charlie, dave, eve)
- [X] T014 Create RedemptionRepository with Map-based storage in src/loyalty/repositories/redemption.repository.ts per research.md Decision 1
- [X] T015 Implement stub data seeding for RedemptionRepository per data-model.md stub data
- [X] T016 [P] Create BalanceResponseDto in src/loyalty/dto/balance-response.dto.ts per contracts/openapi.yaml
- [X] T017 [P] Create RedeemRequestDto in src/loyalty/dto/redeem-request.dto.ts with class-validator decorators per contracts/openapi.yaml
- [X] T018 [P] Create RedemptionResponseDto in src/loyalty/dto/redemption-response.dto.ts per contracts/openapi.yaml
- [X] T019 [P] Create RedemptionHistoryResponseDto in src/loyalty/dto/redemption-history.dto.ts per contracts/openapi.yaml
- [X] T020 Register OrderRepository and RedemptionRepository as providers in loyalty.module.ts

**Checkpoint**: Foundation ready - all repositories, entities, and DTOs exist. User story implementation can now begin.

---

## Phase 3: User Story 1 - Check Available Loyalty Points Balance (Priority: P1) 🎯 MVP

**Goal**: Enable users to check their current loyalty points balance calculated from orders minus redemptions

**Independent Test**: Create a user with known orders and redemptions, call GET /loyalty/{userId}/balance, verify balance calculation is correct (earned - redeemed). Works without requiring redemption or history functionality.

### Tests for User Story 1 (TDD Approach - Write First)

> **CRITICAL: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T021 [P] [US1] Create unit test for calculateBalance in test/unit/loyalty.service.spec.ts - test scenario: user with orders and redemptions (alice: 300 earned, 100 redeemed = 200 balance)
- [X] T022 [P] [US1] Add unit test for calculateBalance - test scenario: user with no orders (bob: 0 balance)
- [X] T023 [P] [US1] Add unit test for calculateBalance - test scenario: user with fully redeemed points (charlie: 500 earned, 500 redeemed = 0 balance)
- [X] T024 [P] [US1] Add unit test for calculateBalance - test scenario: user with cancelled orders (dave: only active orders count)
- [X] T025 [P] [US1] Create e2e test for GET /loyalty/:userId/balance in test/e2e/loyalty.e2e-spec.ts - success case (alice returns 200 balance)
- [X] T026 [P] [US1] Add e2e test for GET /loyalty/:userId/balance - user not found case (404 error)
- [X] T027 [P] [US1] Add e2e test for GET /loyalty/:userId/balance - performance test (<2s response time per plan.md)

### Implementation for User Story 1

- [X] T028 [US1] Create LoyaltyService in src/loyalty/loyalty.service.ts with @Injectable decorator
- [X] T029 [US1] Implement calculateBalance method in LoyaltyService per data-model.md calculation logic (filter active orders, sum points, subtract redemptions)
- [X] T030 [US1] Implement getBalance method in LoyaltyService that returns BalanceResponseDto
- [X] T031 [US1] Add user existence validation in getBalance (throw NotFoundException if user not found) per research.md Decision 7
- [X] T032 [US1] Create LoyaltyController in src/loyalty/loyalty.controller.ts with @Controller decorator
- [X] T033 [US1] Implement GET /loyalty/:userId/balance endpoint in LoyaltyController calling LoyaltyService.getBalance
- [X] T034 [US1] Register LoyaltyService and LoyaltyController in loyalty.module.ts providers and controllers
- [X] T035 [US1] Import LoyaltyModule in app.module.ts
- [X] T036 [US1] Verify all US1 unit tests pass (T021-T024)
- [X] T037 [US1] Verify all US1 e2e tests pass (T025-T027)

**Checkpoint**: User Story 1 complete - users can check their balance. This is the MVP! Test independently: `curl http://localhost:3000/loyalty/alice/balance`

---

## Phase 4: User Story 2 - Redeem Loyalty Points (Priority: P2)

**Goal**: Enable users to redeem their available loyalty points with validation to prevent overdraft

**Independent Test**: Create a user with a known points balance, submit a redemption request via POST /loyalty/{userId}/redeem, verify redemption is recorded and balance is reduced. Works independently of history functionality.

### Tests for User Story 2 (TDD Approach - Write First)

> **CRITICAL: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T038 [P] [US2] Create unit test for redeemPoints in test/unit/loyalty.service.spec.ts - test scenario: valid redemption (alice has 300, redeem 100, balance = 200)
- [X] T039 [P] [US2] Add unit test for redeemPoints - test scenario: insufficient points (bob has 0, redeem 100, throws ConflictException)
- [X] T040 [P] [US2] Add unit test for redeemPoints - test scenario: exact balance redemption (user has 100, redeem 100, balance = 0)
- [X] T041 [P] [US2] Add unit test for redeemPoints - test scenario: negative/zero points validation (throws BadRequestException)
- [X] T042 [P] [US2] Add unit test for concurrent redemption safety - test scenario: two redemptions for same user are serialized per research.md Decision 3
- [X] T043 [P] [US2] Create e2e test for POST /loyalty/:userId/redeem in test/e2e/loyalty.e2e-spec.ts - success case (201 with redemption response)
- [X] T044 [P] [US2] Add e2e test for POST /loyalty/:userId/redeem - insufficient points case (409 Conflict)
- [X] T045 [P] [US2] Add e2e test for POST /loyalty/:userId/redeem - validation error case (400 for negative points)
- [X] T046 [P] [US2] Add e2e test for POST /loyalty/:userId/redeem - user not found case (404 error)
- [X] T047 [P] [US2] Add e2e test for POST /loyalty/:userId/redeem - performance test (<3s response time per plan.md)

### Implementation for User Story 2

- [X] T048 [US2] Install uuid package for redemption ID generation: npm install uuid @types/uuid
- [X] T049 [US2] Implement per-user mutex lock in LoyaltyService using Map<string, Promise<void>> per research.md Decision 3
- [X] T050 [US2] Implement redeemPoints method in LoyaltyService with balance validation (insufficient points check)
- [X] T051 [US2] Add user existence validation in redeemPoints (throw NotFoundException if user not found)
- [X] T052 [US2] Add positive points validation in redeemPoints (throw BadRequestException if points <= 0) per research.md Decision 7
- [X] T053 [US2] Generate UUID v4 for redemption ID in redeemPoints using uuid package
- [X] T054 [US2] Save redemption record via RedemptionRepository.save in redeemPoints
- [X] T055 [US2] Calculate newBalance after redemption in redeemPoints
- [X] T056 [US2] Return RedemptionResponseDto with redemptionId, userId, points, timestamp, newBalance
- [X] T057 [US2] Implement POST /loyalty/:userId/redeem endpoint in LoyaltyController calling LoyaltyService.redeemPoints
- [X] T058 [US2] Add @HttpCode(201) decorator to redeem endpoint per contracts/openapi.yaml
- [X] T059 [US2] Verify all US2 unit tests pass (T038-T042)
- [X] T060 [US2] Verify all US2 e2e tests pass (T043-T047)

**Checkpoint**: User Stories 1 AND 2 complete - users can check balance and redeem points. Test independently: Check balance → Redeem points → Verify balance decreased.

---

## Phase 5: User Story 3 - View Redemption History (Priority: P3)

**Goal**: Enable users to view their past redemptions for transparency and audit capability

**Independent Test**: Create a user with multiple redemptions over time, call GET /loyalty/{userId}/redemptions, verify all redemptions are returned in reverse chronological order. Works independently once redemption functionality exists.

### Tests for User Story 3 (TDD Approach - Write First)

> **CRITICAL: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T061 [P] [US3] Create unit test for getRedemptionHistory in test/unit/loyalty.service.spec.ts - test scenario: user with multiple redemptions (eve: 2 redemptions returned in reverse chronological order)
- [X] T062 [P] [US3] Add unit test for getRedemptionHistory - test scenario: user with no redemptions (bob: empty array)
- [X] T063 [P] [US3] Add unit test for getRedemptionHistory - test scenario: verify sorting by timestamp descending (newest first)
- [X] T064 [P] [US3] Create e2e test for GET /loyalty/:userId/redemptions in test/e2e/loyalty.e2e-spec.ts - success case with multiple redemptions
- [X] T065 [P] [US3] Add e2e test for GET /loyalty/:userId/redemptions - empty history case
- [X] T066 [P] [US3] Add e2e test for GET /loyalty/:userId/redemptions - user not found case (404 error)

### Implementation for User Story 3

- [X] T067 [US3] Implement getRedemptionHistory method in LoyaltyService that retrieves redemptions from RedemptionRepository
- [X] T068 [US3] Sort redemptions by timestamp descending in getRedemptionHistory per spec.md FR-016
- [X] T069 [US3] Add user existence validation in getRedemptionHistory (throw NotFoundException if user not found)
- [X] T070 [US3] Return RedemptionHistoryResponseDto with userId and redemptions array
- [X] T071 [US3] Implement GET /loyalty/:userId/redemptions endpoint in LoyaltyController calling LoyaltyService.getRedemptionHistory
- [X] T072 [US3] Verify all US3 unit tests pass (T061-T063)
- [X] T073 [US3] Verify all US3 e2e tests pass (T064-T066)

**Checkpoint**: All user stories complete - users can check balance, redeem points, and view history. Test full flow independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [X] T074 [P] Add comprehensive error handling with proper HTTP status codes across all endpoints per research.md Decision 7
- [X] T075 [P] Add logging for all service operations (balance checks, redemptions, history requests)
- [X] T076 [P] Update README.md with API documentation and quickstart instructions
- [X] T077 [P] Verify all acceptance scenarios from spec.md are covered by tests
- [X] T078 Run quickstart.md validation: npm run start:dev and test all API endpoints with curl commands
- [X] T079 Run full test suite: npm test and npm run test:e2e
- [X] T080 Run linting: npm run lint
- [X] T081 Generate test coverage report: npm run test:cov and verify >80% coverage

**Final Checkpoint**: Feature complete and ready for deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Stories (Phases 3-5)**: All depend on Foundational (Phase 2) completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories (Phases 3-5) being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independently testable but integrates with US1's balance calculation
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Depends on redemption data existing from US2, but can be tested independently

### Within Each User Story (TDD Workflow)

1. **Tests FIRST**: Write all tests for the story (marked [P] can be written in parallel)
2. **Verify tests FAIL**: Run tests and confirm they fail (no implementation yet)
3. **Implementation**: Build the feature
   - Models/Entities (if needed)
   - Service methods
   - Controller endpoints
   - Error handling
4. **Verify tests PASS**: Run tests and confirm they all pass
5. **Story complete**: Move to next priority

### Parallel Opportunities

#### Setup Phase
- T003, T004, T005 can run in parallel (different files)

#### Foundational Phase
- T009, T010, T011 can run in parallel (different entity files)
- T016, T017, T018, T019 can run in parallel (different DTO files)

#### User Story 1 Tests
- T021, T022, T023, T024 can run in parallel (different test cases in same file, write together)
- T025, T026, T027 can run in parallel (different test cases)

#### User Story 2 Tests
- T038, T039, T040, T041, T042 can run in parallel
- T043, T044, T045, T046, T047 can run in parallel

#### User Story 3 Tests
- T061, T062, T063 can run in parallel
- T064, T065, T066 can run in parallel

#### Polish Phase
- T074, T075, T076, T077 can run in parallel (different concerns)

#### Cross-Story Parallelization
Once Foundational (Phase 2) is complete:
- Developer A: Complete User Story 1 (T021-T037)
- Developer B: Complete User Story 2 (T038-T060)
- Developer C: Complete User Story 3 (T061-T073)

Stories can be worked on in parallel by different team members.

---

## Parallel Execution Examples

### Example 1: User Story 1 - All Tests Together

```bash
# Launch all unit tests for US1 together:
Task: "Create unit test for calculateBalance - alice scenario in test/unit/loyalty.service.spec.ts"
Task: "Add unit test for calculateBalance - bob scenario in test/unit/loyalty.service.spec.ts"
Task: "Add unit test for calculateBalance - charlie scenario in test/unit/loyalty.service.spec.ts"
Task: "Add unit test for calculateBalance - dave scenario in test/unit/loyalty.service.spec.ts"

# Launch all e2e tests for US1 together:
Task: "Create e2e test for GET /loyalty/:userId/balance - success case"
Task: "Add e2e test for GET /loyalty/:userId/balance - 404 case"
Task: "Add e2e test for GET /loyalty/:userId/balance - performance test"
```

### Example 2: Foundational - All DTOs Together

```bash
# Launch all DTO creation tasks together:
Task: "Create BalanceResponseDto in src/loyalty/dto/balance-response.dto.ts"
Task: "Create RedeemRequestDto in src/loyalty/dto/redeem-request.dto.ts"
Task: "Create RedemptionResponseDto in src/loyalty/dto/redemption-response.dto.ts"
Task: "Create RedemptionHistoryResponseDto in src/loyalty/dto/redemption-history.dto.ts"
```

### Example 3: All User Stories in Parallel (3 developers)

```bash
# After Foundational Phase completes:

# Developer A:
Task: "Complete all User Story 1 tasks (T021-T037)"

# Developer B:
Task: "Complete all User Story 2 tasks (T038-T060)"

# Developer C:
Task: "Complete all User Story 3 tasks (T061-T073)"
```

---

## Implementation Strategy

### MVP First (Recommended - User Story 1 Only)

1. **Complete Phase 1**: Setup (T001-T007)
2. **Complete Phase 2**: Foundational (T008-T020) - CRITICAL blocking phase
3. **Complete Phase 3**: User Story 1 (T021-T037)
4. **STOP and VALIDATE**: 
   - Run tests: `npm test` and `npm run test:e2e`
   - Start server: `npm run start:dev`
   - Test manually: `curl http://localhost:3000/loyalty/alice/balance`
   - Verify response: `{"userId":"alice","balance":200,"earnedPoints":300,"redeemedPoints":100}`
5. **Deploy/Demo if ready**: You now have a working MVP!

**MVP Delivers**: Users can check their loyalty points balance ✅

### Incremental Delivery (Recommended)

1. **Foundation**: Complete Setup + Foundational → Foundation ready
2. **MVP Release**: Add User Story 1 → Test independently → Deploy/Demo
   - **Value**: Balance checking capability
   - **Working**: GET /loyalty/:userId/balance
3. **Version 2**: Add User Story 2 → Test independently → Deploy/Demo
   - **Value**: Redemption capability
   - **Working**: Balance + redemption
4. **Version 3**: Add User Story 3 → Test independently → Deploy/Demo
   - **Value**: Full transparency with history
   - **Working**: Complete loyalty system
5. **Final Polish**: Phase 6 → Production ready

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy (3+ Developers)

1. **Together**: Team completes Setup (Phase 1) + Foundational (Phase 2)
2. **Split**: Once Foundational is done:
   - Developer A: User Story 1 (P1) - T021-T037
   - Developer B: User Story 2 (P2) - T038-T060
   - Developer C: User Story 3 (P3) - T061-T073
3. **Integrate**: Stories complete independently, verify together
4. **Together**: Team completes Polish (Phase 6)

**Timeline**: ~3-4 days with parallel execution vs ~6-7 days sequential

---

## Validation Checklist

Before marking feature complete, verify:

- [ ] All 81 tasks completed
- [ ] All unit tests pass (`npm test`)
- [ ] All e2e tests pass (`npm run test:e2e`)
- [ ] Test coverage >80% (`npm run test:cov`)
- [ ] All acceptance scenarios from spec.md covered
- [ ] All API endpoints work per quickstart.md
- [ ] Linting passes (`npm run lint`)
- [ ] Performance targets met (<2s balance, <3s redemption)
- [ ] All user stories independently testable
- [ ] README.md updated with API documentation
- [ ] Constitution principles verified (TDD ✅, Type Safety ✅, Module Architecture ✅, Simplicity ✅)

---

## Notes

**TDD Emphasis**: This feature follows Test-Driven Development per Constitution Principle III:
- Write tests FIRST for each user story
- Ensure tests FAIL before implementation
- Implement feature to make tests PASS
- Refactor if needed while keeping tests green

**Task Format Compliance**:
- ✅ All tasks have checkbox `- [ ]`
- ✅ All tasks have sequential IDs (T001-T081)
- ✅ Parallelizable tasks marked with [P]
- ✅ User story tasks marked with [US1], [US2], or [US3]
- ✅ All tasks have specific file paths
- ✅ No vague tasks

**Independent User Stories**:
- US1 can be completed and tested without US2 or US3
- US2 can be completed and tested without US3
- US3 depends on redemption data but tests with stub data
- Each story delivers independent value

**Stub Data Coverage** (per data-model.md):
- alice: 300 earned, 100 redeemed → 200 balance (normal user)
- bob: 0 earned, 0 redeemed → 0 balance (new user)
- charlie: 500 earned, 500 redeemed → 0 balance (fully redeemed)
- dave: 200 earned (1 cancelled order excluded) → 200 balance (cancellation test)
- eve: 250 earned, 100 redeemed → 150 balance (multiple redemptions for history)

**Tech Stack** (per plan.md):
- NestJS 11.x (framework)
- TypeScript 5.7 with strict mode
- Jest 30.x (testing)
- class-validator (validation)
- In-memory Map storage (no database)

**Performance Targets** (per plan.md):
- Balance checks: <2s response time
- Redemption operations: <3s response time
- 1000 concurrent requests supported

---

**Status**: ✅ Tasks ready for execution  
**Total Tasks**: 81  
**Estimated Timeline**: 
- MVP (Setup + Foundation + US1): 2-3 days
- Full Feature (All Stories): 5-7 days sequential, 3-4 days parallel
- Polish: 1 day

**Feature Branch**: `001-loyalty-api`  
**Last Updated**: 2025-01-21
