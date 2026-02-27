import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Entity as PrismaEntity, Prisma } from '@prisma/client';
import { AttributeValues } from '@app-atlas/shared';
import { TenantContextService } from '../common/services/tenant-context.service';

export interface EntityRecord {
  id: string;
  entityType: string;
  name: string;
  description: string;
  attributes: AttributeValues;
  tenantId: string | null;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
  deletedAt: Date | null;
  deletedBy: string | null;
}

export interface CreateEntityInput {
  entityType: string;
  name: string;
  description?: string;
  attributes?: AttributeValues;
  updatedBy?: string;
}

export interface UpdateEntityInput {
  name?: string;
  description?: string;
  attributes?: AttributeValues;
  updatedBy?: string;
}

export interface FindEntitiesOptions {
  entityType?: string;
  includeDeleted?: boolean;
  attributeFilters?: Record<string, unknown>;
  search?: string;
  skip?: number;
  take?: number;
  orderBy?: 'name' | 'createdAt' | 'updatedAt';
  orderDirection?: 'asc' | 'desc';
}

@Injectable()
export class EntityRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) { }

  async create(input: CreateEntityInput): Promise<EntityRecord> {
    const tenantId = this.tenantContext.getTenantId();
    const entity = await this.prisma.entity.create({
      data: {
        entityType: input.entityType,
        name: input.name,
        description: input.description ?? '',
        attributes: (input.attributes ?? {}) as object,
        tenantId,
        updatedBy: input.updatedBy,
      },
    });

    return this.mapToEntityRecord(entity);
  }

  async findById(
    id: string,
    options: { includeDeleted?: boolean; entityType?: string } = {},
  ): Promise<EntityRecord | null> {
    const tenantId = this.tenantContext.getTenantId();
    const entity = await this.prisma.entity.findFirst({
      where: {
        id,
        tenantId,
        ...(options.entityType && { entityType: options.entityType }),
        ...(options.includeDeleted ? {} : { deletedAt: null }),
      },
    });

    return entity ? this.mapToEntityRecord(entity) : null;
  }

  async findByIdOrThrow(
    id: string,
    options: { includeDeleted?: boolean; entityType?: string } = {},
  ): Promise<EntityRecord> {
    const entity = await this.findById(id, options);
    if (!entity) {
      throw new NotFoundException(`Entity with ID "${id}" not found`);
    }
    return entity;
  }

  async findMany(options: FindEntitiesOptions = {}): Promise<EntityRecord[]> {
    const {
      entityType,
      includeDeleted = false,
      attributeFilters,
      search,
      skip,
      take,
      orderBy = 'name',
      orderDirection = 'asc',
    } = options;
    const tenantId = this.tenantContext.getTenantId();

    const where = this.buildWhereClause({
      entityType,
      includeDeleted,
      tenantId,
      search,
      attributeFilters,
    });

    const entities = await this.prisma.entity.findMany({
      where,
      skip,
      take,
      orderBy: { [orderBy]: orderDirection },
    });

    return entities.map((entity: PrismaEntity) => this.mapToEntityRecord(entity));
  }

  async update(
    id: string,
    input: UpdateEntityInput,
    options: { mergeAttributes?: boolean; entityType?: string } = { mergeAttributes: true },
  ): Promise<EntityRecord> {
    const existing = await this.findByIdOrThrow(id, { entityType: options.entityType });

    let newAttributes = input.attributes;
    if (options.mergeAttributes && input.attributes) {
      newAttributes = {
        ...existing.attributes,
        ...input.attributes,
      } as AttributeValues;
    }

    const entity = await this.prisma.entity.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(newAttributes !== undefined && {
          attributes: newAttributes as object,
        }),
        updatedBy: input.updatedBy,
      },
    });

    return this.mapToEntityRecord(entity);
  }

  async softDelete(
    id: string,
    deletedBy?: string,
    entityType?: string,
  ): Promise<EntityRecord> {
    await this.findByIdOrThrow(id, { entityType });

    const entity = await this.prisma.entity.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    });

    return this.mapToEntityRecord(entity);
  }

  async restore(
    id: string,
    restoredBy?: string,
    entityType?: string,
  ): Promise<EntityRecord> {
    const existing = await this.findByIdOrThrow(id, { includeDeleted: true, entityType });

    if (!existing.deletedAt) {
      throw new BadRequestException(`Entity with ID "${id}" is not deleted`);
    }

    const entity = await this.prisma.entity.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
        updatedBy: restoredBy,
      },
    });

    return this.mapToEntityRecord(entity);
  }

  async count(options: Omit<FindEntitiesOptions, 'skip' | 'take' | 'orderBy' | 'orderDirection'> = {}): Promise<number> {
    const { entityType, includeDeleted = false, search, attributeFilters } = options;
    const tenantId = this.tenantContext.getTenantId();

    const where = this.buildWhereClause({
      entityType,
      includeDeleted,
      tenantId,
      search,
      attributeFilters,
    });

    return this.prisma.entity.count({ where });
  }

  private buildWhereClause(options: {
    entityType?: string;
    includeDeleted?: boolean;
    tenantId?: string;
    search?: string;
    attributeFilters?: Record<string, unknown>;
  }): Prisma.EntityWhereInput {
    const { entityType, includeDeleted, tenantId, search, attributeFilters } = options;

    const where: Prisma.EntityWhereInput = {
      ...(entityType && { entityType }),
      ...(tenantId && { tenantId }),
      ...(includeDeleted ? {} : { deletedAt: null }),
    };

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
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

  private mapToEntityRecord(entity: PrismaEntity): EntityRecord {
    return {
      id: entity.id,
      entityType: entity.entityType,
      name: entity.name,
      description: entity.description,
      attributes: (entity.attributes ?? {}) as AttributeValues,
      tenantId: entity.tenantId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      updatedBy: entity.updatedBy,
      deletedAt: entity.deletedAt,
      deletedBy: entity.deletedBy,
    };
  }
}
