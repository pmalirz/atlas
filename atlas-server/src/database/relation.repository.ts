import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Relation as PrismaRelation, Prisma } from '@prisma/client';
import { AttributeValues } from '@app-atlas/shared';
import { TenantContextService } from '../common/services/tenant-context.service';

export interface RelationRecord {
  id: string;
  relationType: string;
  fromEntityId: string;
  toEntityId: string;
  attributes: AttributeValues;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
  deletedAt: Date | null;
  deletedBy: string | null;
}

export interface CreateRelationInput {
  relationType: string;
  fromEntityId: string;
  toEntityId: string;
  attributes?: AttributeValues;
  updatedBy?: string;
}

export interface UpdateRelationInput {
  attributes?: AttributeValues;
  updatedBy?: string;
}

export interface FindRelationsOptions {
  relationType?: string;
  fromEntityId?: string;
  toEntityId?: string;
  entityId?: string; // Match either fromEntityId OR toEntityId
  includeDeleted?: boolean;
  includeEntities?: boolean; // Include fromEntity and toEntity data
  attributeFilters?: Record<string, unknown>;
  skip?: number;
  take?: number;
  orderBy?: 'createdAt' | 'updatedAt';
  orderDirection?: 'asc' | 'desc';
}

@Injectable()
export class RelationRepository {

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) { }

  async create(input: CreateRelationInput): Promise<RelationRecord> {
    const tenantId = this.tenantContext.getTenantId();
    const relation = await this.prisma.relation.create({
      data: {
        relationType: input.relationType,
        fromEntityId: input.fromEntityId,
        toEntityId: input.toEntityId,
        attributes: (input.attributes ?? {}) as object,
        tenantId,
        updatedBy: input.updatedBy,
      },
    });

    return this.mapToRelationRecord(relation);
  }

  async findById(
    id: string,
    options: { includeDeleted?: boolean } = {},
  ): Promise<RelationRecord | null> {
    const tenantId = this.tenantContext.getTenantId();
    const relation = await this.prisma.relation.findFirst({
      where: {
        id,
        tenantId,
        ...(options.includeDeleted ? {} : { deletedAt: null }),
      },
    });

    return relation ? this.mapToRelationRecord(relation) : null;
  }

  async findByIdOrThrow(
    id: string,
    options: { includeDeleted?: boolean } = {},
  ): Promise<RelationRecord> {
    const relation = await this.findById(id, options);
    if (!relation) {
      throw new NotFoundException(`Relation with ID "${id}" not found`);
    }
    return relation;
  }

  async findMany(options: FindRelationsOptions = {}): Promise<RelationRecord[]> {
    const {
      relationType,
      fromEntityId,
      toEntityId,
      entityId,
      includeDeleted = false,
      attributeFilters,
      skip,
      take,
      orderBy = 'createdAt',
      orderDirection = 'desc',
    } = options;

    const where = this.buildWhereClause({
      relationType,
      fromEntityId,
      toEntityId,
      entityId,
      includeDeleted,
      attributeFilters,
    });

    const relations = await this.prisma.relation.findMany({
      where,
      skip,
      take,
      orderBy: { [orderBy]: orderDirection },
    });

    return relations.map((relation: PrismaRelation) => this.mapToRelationRecord(relation));
  }

  async update(
    id: string,
    input: UpdateRelationInput,
    options: { mergeAttributes?: boolean } = { mergeAttributes: true },
  ): Promise<RelationRecord> {
    const existing = await this.findByIdOrThrow(id);

    let newAttributes = input.attributes;
    if (options.mergeAttributes && input.attributes) {
      newAttributes = {
        ...existing.attributes,
        ...input.attributes,
      } as AttributeValues;
    }

    const relation = await this.prisma.relation.update({
      where: { id },
      data: {
        ...(newAttributes !== undefined && {
          attributes: newAttributes as object,
        }),
        updatedBy: input.updatedBy,
      },
    });

    return this.mapToRelationRecord(relation);
  }

  async softDelete(id: string, deletedBy?: string): Promise<RelationRecord> {
    await this.findByIdOrThrow(id);

    const relation = await this.prisma.relation.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    });

    return this.mapToRelationRecord(relation);
  }

  async restore(id: string, restoredBy?: string): Promise<RelationRecord> {
    await this.findByIdOrThrow(id, { includeDeleted: true });

    const relation = await this.prisma.relation.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
        updatedBy: restoredBy,
      },
    });

    return this.mapToRelationRecord(relation);
  }

  async count(
    options: Omit<FindRelationsOptions, 'skip' | 'take' | 'orderBy' | 'orderDirection'> = {},
  ): Promise<number> {
    const { relationType, fromEntityId, toEntityId, entityId, includeDeleted = false, attributeFilters } = options;

    const where = this.buildWhereClause({
      relationType,
      fromEntityId,
      toEntityId,
      entityId,
      includeDeleted,
      attributeFilters,
    });

    return this.prisma.relation.count({ where });
  }

  private buildWhereClause(options: {
    relationType?: string;
    fromEntityId?: string;
    toEntityId?: string;
    entityId?: string;
    includeDeleted?: boolean;
    attributeFilters?: Record<string, unknown>;
  }): Prisma.RelationWhereInput {
    const { relationType, fromEntityId, toEntityId, entityId, includeDeleted, attributeFilters } = options;
    const tenantId = this.tenantContext.getTenantId();

    const where: Prisma.RelationWhereInput = {
      tenantId,
      ...(relationType && { relationType }),
      ...(fromEntityId && { fromEntityId }),
      ...(toEntityId && { toEntityId }),
      ...(includeDeleted ? {} : { deletedAt: null }),
    };

    if (entityId) {
      where.OR = [{ fromEntityId: entityId }, { toEntityId: entityId }];
    }

    if (attributeFilters && Object.keys(attributeFilters).length > 0) {
      const filters = Object.entries(attributeFilters).map(([key, value]) => ({
        attributes: {
          path: [key],
          equals: value as Prisma.InputJsonValue,
        },
      }));

      if (filters.length > 0) {
        where.AND = filters;
      }
    }

    return where;
  }

  private mapToRelationRecord(relation: PrismaRelation): RelationRecord {
    return {
      id: relation.id,
      relationType: relation.relationType,
      fromEntityId: relation.fromEntityId,
      toEntityId: relation.toEntityId,
      attributes: (relation.attributes ?? {}) as AttributeValues,
      createdAt: relation.createdAt,
      updatedAt: relation.updatedAt,
      updatedBy: relation.updatedBy,
      deletedAt: relation.deletedAt,
      deletedBy: relation.deletedBy,
    };
  }
}
