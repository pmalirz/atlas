import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsArray, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetRelationGraphDto {
  @ApiPropertyOptional({ description: 'Depth of traversal (1-5, default: 1)', minimum: 1, maximum: 5, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  depth?: number = 1;

  @ApiPropertyOptional({ description: 'Comma-separated relation types to exclude' })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  exclude?: string[];
}
