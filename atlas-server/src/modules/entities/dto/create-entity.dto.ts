import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject, MinLength } from 'class-validator';
import { AttributeValues } from '@app-atlas/shared';

export class CreateEntityDto {
  @ApiProperty({ description: 'Entity name', example: 'My Application' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ description: 'Entity description', example: 'A description of the entity' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Entity attributes (JSONB)',
    example: { status: 'active', criticality: 'high' },
  })
  @IsObject()
  @IsOptional()
  attributes?: AttributeValues;
}

