# Feature Specification: Loyalty Points API Service

**Feature Branch**: `001-loyalty-api`  
**Created**: 2025-01-21  
**Status**: Draft  
**Input**: User description: "Loyalty API service with the following requirements:

**Project Context:**
- Technology: NestJS (TypeScript)
- Service Name: loyalty-service
- Purpose: API service for managing user loyalty points

**Core Requirements:**

1. **Read Loyalty Points (for a User)**
   - Calculate available loyalty points based on:
     - List of orders for the user
     - Minus any redeemed loyalty points for the user
   - Return current loyalty point balance

2. **Redeem Loyalty Points (for a User)**
   - Allow users to redeem their available loyalty points
   - Track redemptions
   - Ensure users cannot redeem more points than available

**Additional Context:**
- This is a new service being built from scratch
- Need to support user identification
- Need to track orders and their associated points
- Need to track redemption history"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Check Available Loyalty Points Balance (Priority: P1)

As a user of the loyalty program, I want to check my current loyalty points balance so that I know how many points I have available to redeem for rewards or discounts.

**Why this priority**: This is the foundational capability - users need to know their balance before they can redeem. Without this, users cannot make informed decisions about redemptions. This represents the core read operation and delivers immediate value.

**Independent Test**: Can be fully tested by creating a user with some orders (that generate points) and some redemptions, then retrieving their balance. Delivers value by allowing users to view their loyalty status without requiring redemption functionality.

**Acceptance Scenarios**:

1. **Given** a user has placed 3 orders worth 100 points each and has redeemed 50 points, **When** the user requests their loyalty points balance, **Then** the system returns 250 available points
2. **Given** a user has placed no orders and has no redemptions, **When** the user requests their loyalty points balance, **Then** the system returns 0 available points
3. **Given** a user has placed orders worth 500 points total and has redeemed 500 points, **When** the user requests their loyalty points balance, **Then** the system returns 0 available points
4. **Given** a user has placed orders worth 1000 points, **When** the user requests their balance, **Then** the system returns the balance within 2 seconds
5. **Given** a user has placed 5 orders worth 100 points each (500 total) and one order worth 100 points is then cancelled or refunded, **When** the user requests their loyalty points balance, **Then** the system returns 400 available points

---

### User Story 2 - Redeem Loyalty Points (Priority: P2)

As a user with accumulated loyalty points, I want to redeem my points for rewards so that I can receive discounts or benefits from my loyalty program participation.

**Why this priority**: This is the primary action users take with their points - the "write" operation that completes the loyalty cycle. It depends on users being able to check their balance (P1) but is independently valuable as the redemption mechanism.

**Independent Test**: Can be fully tested by creating a user with a known points balance, submitting a redemption request, and verifying the redemption is recorded and balance is reduced. Delivers value by allowing users to convert loyalty points into tangible benefits.

**Acceptance Scenarios**:

1. **Given** a user has 300 available points, **When** the user redeems 100 points, **Then** the redemption is successful and their new balance is 200 points
2. **Given** a user has 50 available points, **When** the user attempts to redeem 100 points, **Then** the redemption is rejected with a clear error message indicating insufficient points
3. **Given** a user has 100 available points, **When** the user redeems exactly 100 points, **Then** the redemption is successful and their balance is 0 points
4. **Given** a user attempts to redeem points, **When** the redemption amount is negative or zero, **Then** the system rejects the request with an appropriate validation error
5. **Given** a user has 500 available points, **When** the user successfully redeems 200 points, **Then** the redemption is recorded with the redemption amount, timestamp, and user identifier

---

### User Story 3 - View Redemption History (Priority: P3)

As a user, I want to view my past redemptions so that I can track how I've used my loyalty points over time and verify my transactions.

**Why this priority**: This is an enhancement that provides transparency and audit capability. While valuable for user trust and support scenarios, it's not required for the core loyalty operations (check balance and redeem).

**Independent Test**: Can be fully tested by creating a user with multiple redemptions over time, then retrieving their redemption history. Delivers value by providing users with transaction transparency and helping resolve disputes.

**Acceptance Scenarios**:

1. **Given** a user has made 3 redemptions of 50, 100, and 75 points, **When** the user requests their redemption history, **Then** the system returns all 3 redemptions with amounts and timestamps in reverse chronological order
2. **Given** a user has never redeemed any points, **When** the user requests their redemption history, **Then** the system returns an empty list
3. **Given** a user has made 100 redemptions, **When** the user requests their redemption history with pagination, **Then** the system returns results in manageable pages

---

### Edge Cases

- When a user's orders are cancelled or refunded, the points from those orders must be deducted from their available balance
- How does the system handle concurrent redemption requests from the same user?
- What happens if the points calculation involves orders with different point values or conversion rates?
- How does the system handle redemption requests during system maintenance or when external order data is temporarily unavailable?
- What happens when a user identifier doesn't exist in the system?
- How does the system handle very large point balances (e.g., millions of points)?
- What happens if order data is corrupted or missing required fields for point calculation?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST calculate available loyalty points for a user by summing points from all their orders
- **FR-002**: System MUST subtract redeemed points from the total earned points when calculating available balance
- **FR-003**: System MUST accept a user identifier to retrieve loyalty point balance for that specific user
- **FR-004**: System MUST return current available loyalty points balance as a numeric value
- **FR-005**: System MUST accept redemption requests with a user identifier and redemption amount
- **FR-006**: System MUST validate that redemption amount does not exceed available points before processing
- **FR-007**: System MUST reject redemption requests when user has insufficient available points
- **FR-008**: System MUST record each redemption with the amount redeemed, user identifier, and timestamp
- **FR-009**: System MUST persist redemption records for historical tracking and audit purposes
- **FR-010**: System MUST prevent redemption of negative or zero point amounts
- **FR-011**: System MUST retrieve order data for a user to calculate their earned points
- **FR-012**: System MUST handle cases where a user has no orders (zero earned points)
- **FR-013**: System MUST handle cases where a user has no redemptions (zero redeemed points)
- **FR-014**: System MUST return appropriate error messages when user identifier is invalid or not found
- **FR-015**: System MUST provide redemption history for a given user showing all past redemptions
- **FR-016**: System MUST order redemption history by timestamp in reverse chronological order (newest first)
- **FR-017**: System MUST calculate points accurately even when orders have varying point values
- **FR-018**: System MUST ensure data consistency when processing concurrent requests for the same user
- **FR-019**: System MUST exclude points from cancelled or refunded orders when calculating available balance
- **FR-020**: System MUST handle order status changes (cancellations/refunds) by recalculating available balance to reflect only points from active orders

### Key Entities *(include if feature involves data)*

- **User**: Represents a loyalty program participant identified by a unique user identifier; no personal data stored in loyalty service, only the identifier for tracking points and redemptions

- **Order**: Represents a purchase or transaction that earns loyalty points; includes user identifier (to link to user), order identifier, and points value; order data may originate from external systems

- **Redemption**: Represents a single instance of a user redeeming loyalty points; includes redemption identifier, user identifier (to link to user), points amount redeemed, and redemption timestamp; forms the historical record of point usage

- **Loyalty Points Balance**: A calculated value (not stored) representing the difference between total earned points (from orders) and total redeemed points (from redemptions) for a specific user; always derived in real-time from order and redemption data

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can retrieve their loyalty points balance within 2 seconds under normal load conditions
- **SC-002**: System successfully processes redemption requests within 3 seconds from request to confirmation
- **SC-003**: System maintains 99.9% accuracy in points calculation (earned minus redeemed equals available balance)
- **SC-004**: 100% of redemption attempts with insufficient points are rejected with clear error messages
- **SC-005**: System handles at least 1,000 concurrent balance check requests without performance degradation
- **SC-006**: All redemption transactions are successfully recorded with complete audit information (user, amount, timestamp)
- **SC-007**: Zero instances of users redeeming more points than available (no overdraft scenarios)
- **SC-008**: Redemption history retrieval completes within 2 seconds for users with up to 1,000 historical redemptions
- **SC-009**: System maintains data consistency with zero discrepancies between calculated balance and actual earned/redeemed points
- **SC-010**: 95% of API requests return successful responses (excluding expected validation failures like insufficient points)

## Assumptions *(optional)*

- Order data (including points earned per order) will be provided by external systems or services; the loyalty service is responsible for consuming this data but not for calculating how many points an individual order is worth
- User authentication and authorization will be handled by external systems; the loyalty service receives pre-authenticated user identifiers and trusts them
- Each order has a pre-calculated points value that the loyalty service simply aggregates; the business rules for point calculation per order are outside this service's scope
- Redemption requests represent intent to use points; the actual fulfillment of rewards (discounts, products, etc.) is handled by external systems
- The service will be deployed in a cloud environment with standard infrastructure availability (databases, networking, etc.)
- Point values are expressed as whole numbers (integers); fractional points are not supported
- User identifiers are immutable and unique across the system
- Orders cannot be deleted once created, though they may be cancelled or refunded; when an order is cancelled or refunded, points from that order are deducted from the user's available balance
- The service operates in a single currency/points system; multi-currency or tiered points programs are out of scope
- Historical redemption data must be retained indefinitely for audit and compliance purposes

## Constraints *(optional)*

- Service must maintain backward compatibility with API contracts once deployed to production
- Service must operate within the performance and scalability standards of the broader microservices architecture
- All data operations must be atomic to prevent race conditions during concurrent redemptions
- The service should not maintain cached balances to avoid stale data; balances are always calculated in real-time from source data
- External order data source must be available; if unavailable, balance checks should fail gracefully with appropriate error messaging
- Redemption operations must be idempotent to handle retry scenarios without double-processing

## Out of Scope *(optional)*

- User registration and profile management (handled by user service)
- Authentication and authorization mechanisms (handled by API gateway or auth service)
- Order creation and management (handled by order service)
- Business rules for calculating points per order (e.g., $1 = 10 points)
- Reward catalog and redemption fulfillment (what users can redeem points for)
- Point expiration policies
- Point transfers between users
- Tiered loyalty programs or member levels
- Promotional bonus points or multipliers
- Notification systems for points earned or redeemed
- Administrative tools for manual point adjustments
- Reporting and analytics dashboards
- Integration with payment processors
- Fraud detection and prevention
