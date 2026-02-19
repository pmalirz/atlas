import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsIn, IsBoolean, MinLength, IsObject } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryEntitiesDto {
  @ApiPropertyOptional({ description: 'Search by name (case-insensitive, partial match)', example: 'CRM' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  search?: string;

  @ApiPropertyOptional({ description: 'Include soft-deleted entities', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeDeleted?: boolean;

  @ApiPropertyOptional({ description: 'Skip N records (pagination)', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  skip?: number;

  @ApiPropertyOptional({ description: 'Take N records (pagination)', minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  take?: number;

  @ApiPropertyOptional({ description: 'Order by field', enum: ['name', 'createdAt', 'updatedAt'], default: 'name' })
  @IsOptional()
  @IsString()
  @IsIn(['name', 'createdAt', 'updatedAt'])
  orderBy?: 'name' | 'createdAt' | 'updatedAt';

  @ApiPropertyOptional({ description: 'Order direction', enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  orderDirection?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Filter by attribute value (JSON string)', example: '{"status":"active"}' })
  @IsOptional()
  @IsObject()
  @Transform(({ value }) => {
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return value; // Let IsObject fail validation
    }
  })
  filter?: Record<string, unknown>;
}
