/**
 * Data Transfer Objects (DTOs) for Loyalty Points API
 * 
 * These DTOs use class-validator decorators for runtime validation
 * and serve as the contract between API clients and the service.
 * 
 * Import in NestJS controllers and services for type safety.
 */

import { IsString, IsInt, Min, IsOptional, IsUUID, MinLength } from 'class-validator';

// ============================================================================
// Balance DTOs
// ============================================================================

/**
 * Response DTO for GET /loyalty/balance/:userId
 */
export class BalanceResponseDto {
  @IsString()
  @MinLength(1)
  userId: string;

  @IsInt()
  @Min(0)
  availablePoints: number;

  @IsInt()
  @Min(0)
  totalEarned: number;

  @IsInt()
  @Min(0)
  totalRedeemed: number;

  calculatedAt: Date;
}

// ============================================================================
// Redemption DTOs
// ============================================================================

/**
 * Request DTO for POST /loyalty/redeem
 */
export class RedeemRequestDto {
  @IsString()
  @MinLength(1)
  userId: string;

  @IsInt()
  @Min(1, { message: 'Points must be greater than 0' })
  points: number;
}

/**
 * Response DTO for POST /loyalty/redeem
 */
export class RedemptionResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  @MinLength(1)
  userId: string;

  @IsInt()
  @Min(1)
  points: number;

  createdAt: Date;

  @IsInt()
  @Min(0)
  remainingBalance: number;
}

/**
 * Single redemption record in history
 */
export class RedemptionRecordDto {
  @IsUUID()
  id: string;

  @IsInt()
  @Min(1)
  points: number;

  createdAt: Date;
}

/**
 * Response DTO for GET /loyalty/redemptions/:userId
 */
export class RedemptionHistoryResponseDto {
  @IsString()
  @MinLength(1)
  userId: string;

  redemptions: RedemptionRecordDto[];

  @IsInt()
  @Min(0)
  total: number;

  @IsInt()
  @Min(1)
  limit: number;

  @IsInt()
  @Min(0)
  offset: number;
}

/**
 * Query parameters for GET /loyalty/redemptions/:userId
 */
export class RedemptionHistoryQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

// ============================================================================
// Order DTOs
// ============================================================================

/**
 * Request DTO for POST /orders
 */
export class CreateOrderRequestDto {
  @IsString()
  @MinLength(1)
  orderId: string;

  @IsString()
  @MinLength(1)
  userId: string;

  @IsInt()
  @Min(0, { message: 'Points cannot be negative' })
  points: number;
}

/**
 * Response DTO for POST /orders
 */
export class OrderResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  @MinLength(1)
  orderId: string;

  @IsString()
  @MinLength(1)
  userId: string;

  @IsInt()
  @Min(0)
  points: number;

  createdAt: Date;
}

// ============================================================================
// Error DTOs
// ============================================================================

/**
 * Standard error response
 */
export class ErrorResponseDto {
  @IsString()
  error: string;

  @IsString()
  message: string;

  @IsInt()
  statusCode: number;

  @IsOptional()
  timestamp?: Date;
}

/**
 * Insufficient points error (402 Payment Required)
 */
export class InsufficientPointsErrorDto extends ErrorResponseDto {
  @IsInt()
  @Min(0)
  availablePoints: number;

  @IsInt()
  @Min(1)
  requestedPoints: number;
}
