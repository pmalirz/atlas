import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { AttributeValues } from '@app-atlas/shared';

export class CreateRelationDto {
  @ApiProperty({
    description: 'Relation type (e.g., app_uses_asset, asset_depends_on_asset)',
    example: 'app_uses_asset',
  })
  @IsString()
  relationType: string;

  @ApiProperty({
    description: 'Source entity ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  fromEntityId: string;

  @ApiProperty({
    description: 'Target entity ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  toEntityId: string;

  @ApiPropertyOptional({
    description: 'Additional attributes for the relation (JSONB)',
    example: { environment: 'production', isPrimary: true },
  })
  @IsObject()
  @IsOptional()
  attributes?: AttributeValues;
}
