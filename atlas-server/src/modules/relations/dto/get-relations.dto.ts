import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class GetRelationsDto {
  @ApiPropertyOptional({ description: 'Filter by relation type (e.g., app_uses_asset)' })
  @IsOptional()
  @IsString()
  relationType?: string;

  @ApiPropertyOptional({ description: 'Filter by source entity ID' })
  @IsOptional()
  @IsUUID()
  fromEntityId?: string;

  @ApiPropertyOptional({ description: 'Filter by target entity ID' })
  @IsOptional()
  @IsUUID()
  toEntityId?: string;

  @ApiPropertyOptional({ description: 'Filter by entity ID (matches either from or to)' })
  @IsOptional()
  @IsUUID()
  entityId?: string;
}
