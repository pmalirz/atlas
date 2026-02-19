import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';
import { AttributeValues } from '@app-atlas/shared';

export class UpdateRelationDto {
  @ApiPropertyOptional({
    description: 'Updated attributes for the relation (merged with existing)',
    example: { environment: 'staging', capacityAllocation: 50 },
  })
  @IsObject()
  @IsOptional()
  attributes?: AttributeValues;
}
