import { Injectable } from '@nestjs/common';
import {
  RelationRepository,
  RelationRecord,
  FindRelationsOptions,
} from '../../database/relation.repository';
import { PrismaService } from '../../database/prisma.service';
import { SchemaValidatorService } from '../entities/validation/schema-validator.service';
import { CreateRelationDto, UpdateRelationDto } from './dto';

export interface EntitySummary {
  id: string;
  name?: string;
  entityType?: string;
}

export interface RelationResponse {
  id: string;
  relationType: string;
  fromEntityId: string;
  toEntityId: string;
  attributes: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
  fromEntity?: EntitySummary;
  toEntity?: EntitySummary;
}

@Injectable()
export class RelationsService {
  constructor(
    private readonly relationRepository: RelationRepository,
    private readonly prisma: PrismaService,
    private readonly schemaValidator: SchemaValidatorService,
  ) { }

  async create(dto: CreateRelationDto): Promise<RelationResponse> {
    // Validate relation attributes against the attributeSchema
    await this.schemaValidator.validateRelationAttributes(
      dto.relationType,
      dto.attributes,
      false // isUpdate = false
    );

    const relation = await this.relationRepository.create({
      relationType: dto.relationType,
      fromEntityId: dto.fromEntityId,
      toEntityId: dto.toEntityId,
      attributes: dto.attributes,
    });
    return this.toResponse(relation);
  }

  async findAll(options: {
    relationType?: string;
    fromEntityId?: string;
    toEntityId?: string;
    entityId?: string;
    includeEntities?: boolean;
  }): Promise<RelationResponse[]> {
    const findOptions: FindRelationsOptions = {};

    if (options.relationType) {
      findOptions.relationType = options.relationType;
    }
    if (options.fromEntityId) {
      findOptions.fromEntityId = options.fromEntityId;
    }
    if (options.toEntityId) {
      findOptions.toEntityId = options.toEntityId;
    }
    if (options.entityId) {
      findOptions.entityId = options.entityId;
    }

    const relations = await this.relationRepository.findMany(findOptions);

    // If includeEntities is requested, fetch entity info
    if (options.includeEntities !== false) {
      return this.enrichWithEntities(relations);
    }

    return relations.map((r) => this.toResponse(r));
  }

  async findOne(id: string): Promise<RelationResponse> {
    const relation = await this.relationRepository.findByIdOrThrow(id);
    const [enriched] = await this.enrichWithEntities([relation]);
    return enriched;
  }

  async update(id: string, dto: UpdateRelationDto): Promise<RelationResponse> {
    // Fetch existing relation to get relationType
    const existing = await this.relationRepository.findByIdOrThrow(id);

    // Validate relation attributes against the attributeSchema
    await this.schemaValidator.validateRelationAttributes(
      existing.relationType,
      dto.attributes,
      true // isUpdate = true (partial validation)
    );

    const relation = await this.relationRepository.update(id, {
      attributes: dto.attributes,
    });
    return this.toResponse(relation);
  }

  async remove(id: string): Promise<void> {
    await this.relationRepository.softDelete(id);
  }

  /**
   * Get relations for graph visualization with depth traversal.
   * Uses visited set to prevent cycles.
   */
  async getGraphData(
    entityId: string,
    options: {
      depth?: number;
      excludeRelations?: string[];
    } = {},
  ): Promise<RelationResponse[]> {
    const maxDepth = Math.min(options.depth ?? 1, 5); // Cap at 5 levels
    const visited = new Set<string>();
    const relationIds = new Set<string>();
    const allRelations: RelationRecord[] = [];

    await this.collectRelationsRecursive(
      entityId,
      0,
      maxDepth,
      visited,
      relationIds,
      allRelations,
      options.excludeRelations,
    );

    return this.enrichWithEntities(allRelations);
  }

  private async collectRelationsRecursive(
    entityId: string,
    currentDepth: number,
    maxDepth: number,
    visitedEntities: Set<string>,
    visitedRelations: Set<string>,
    results: RelationRecord[],
    excludeRelations?: string[],
  ): Promise<void> {
    if (currentDepth >= maxDepth || visitedEntities.has(entityId)) {
      return;
    }
    visitedEntities.add(entityId);

    // Fetch relations for this entity
    const relations = await this.relationRepository.findMany({ entityId });

    for (const relation of relations) {
      // Skip excluded relation types
      if (excludeRelations?.includes(relation.relationType)) {
        continue;
      }

      // Skip already-visited relations
      if (visitedRelations.has(relation.id)) {
        continue;
      }
      visitedRelations.add(relation.id);
      results.push(relation);

      // Recursively fetch next level
      const nextEntityId =
        relation.fromEntityId === entityId
          ? relation.toEntityId
          : relation.fromEntityId;

      await this.collectRelationsRecursive(
        nextEntityId,
        currentDepth + 1,
        maxDepth,
        visitedEntities,
        visitedRelations,
        results,
        excludeRelations,
      );
    }
  }

  private async enrichWithEntities(relations: RelationRecord[]): Promise<RelationResponse[]> {
    if (relations.length === 0) return [];

    // Collect all unique entity IDs
    const entityIds = new Set<string>();
    relations.forEach(r => {
      entityIds.add(r.fromEntityId);
      entityIds.add(r.toEntityId);
    });

    // Fetch all entities in one query
    const entities = await this.prisma.entity.findMany({
      where: {
        id: { in: Array.from(entityIds) },
      },
      select: {
        id: true,
        name: true,
        entityType: true,
      },
    });

    // Create lookup map
    const entityMap = new Map<string, EntitySummary>();
    entities.forEach((e: EntitySummary) => {
      entityMap.set(e.id, {
        id: e.id,
        name: e.name ?? undefined,
        entityType: e.entityType,
      });
    });

    // Return enriched responses
    return relations.map(r => ({
      ...this.toResponse(r),
      fromEntity: entityMap.get(r.fromEntityId),
      toEntity: entityMap.get(r.toEntityId),
    }));
  }

  private toResponse(relation: RelationRecord): RelationResponse {
    return {
      id: relation.id,
      relationType: relation.relationType,
      fromEntityId: relation.fromEntityId,
      toEntityId: relation.toEntityId,
      attributes: relation.attributes,
      createdAt: relation.createdAt.toISOString(),
      updatedAt: relation.updatedAt.toISOString(),
      updatedBy: relation.updatedBy,
    };
  }
}
