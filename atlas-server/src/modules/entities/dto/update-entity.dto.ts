import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, MinLength } from 'class-validator';
import { AttributeValues } from '@app-atlas/shared';

export class UpdateEntityDto {
  @ApiPropertyOptional({ description: 'Entity name', example: 'Updated Application Name' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ description: 'Entity description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Entity attributes to merge (JSONB)',
    example: { status: 'deprecated' },
  })
  @IsObject()
  @IsOptional()
  attributes?: AttributeValues;
}

