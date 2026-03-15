import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AttributeDefinition } from './validation/type-validators';
import { AttributeValues } from '@app-atlas/shared';
import { EntityRecord } from '../../database/entity.repository';
import { SchemaValidatorService } from './validation/schema-validator.service';
import { TenantContextService } from '../../common/services/tenant-context.service';

/**
 * Relation data as stored/returned
 */
export interface RelationData {
  targetId: string;
  [key: string]: unknown; // Additional attributes like ownershipRole
}

// Minimal interface for Prisma Relation result
interface RelationRecord {
  relationType: string;
  fromEntityId: string;
  toEntityId: string;
  attributes: unknown;
}

interface RelationDefinitionRecord {
  relationType: string;
  fromEntityType: string | null;
  toEntityType: string | null;
}

@Injectable()
export class EntityRelationsService {
  private readonly logger = new Logger(EntityRelationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly schemaValidator: SchemaValidatorService,
    private readonly tenantContext: TenantContextService,
  ) { }

  /**
   * Get all relation-type fields for an entity type
   */
  async getRelationFields(entityType: string): Promise<Map<string, AttributeDefinition>> {
    const fields = await this.schemaValidator.getEntityFields(entityType);

    if (!fields) return new Map();

    return this.getRelationFieldsFromDefinitions(fields);
  }

  /**
   * Extract relation fields from a list of attribute definitions
   */
  getRelationFieldsFromDefinitions(fields: AttributeDefinition[]): Map<string, AttributeDefinition> {
    const relationFields = new Map<string, AttributeDefinition>();

    for (const field of fields) {
      if (field.type === 'relation' && field.relType) {
        relationFields.set(field.key, field);
      }
    }

    return relationFields;
  }

  /**
   * Separate relation data from regular attributes
   */
  extractRelationData(
    attributes: Record<string, unknown>,
    relationFields: Map<string, AttributeDefinition>,
  ): {
    regularAttributes: AttributeValues;
    relationData: Record<string, RelationData[]>;
  } {
    const regularAttributes: AttributeValues = {};
    const relationData: Record<string, RelationData[]> = {};

    for (const [key, value] of Object.entries(attributes)) {
      if (relationFields.has(key)) {
        // This is a relation field
        if (Array.isArray(value)) {
          relationData[key] = value as RelationData[];
        }
      } else {
        regularAttributes[key] = value as AttributeValues[string];
      }
    }

    return { regularAttributes, relationData };
  }

  /**
   * Sync relations to the relations table
   * Deletes existing relations, creates new ones
   */
  async syncRelations(
    entityId: string,
    relationData: Record<string, RelationData[]>,
    relationFields: Map<string, AttributeDefinition>,
    actor?: string,
  ): Promise<void> {
    for (const [fieldKey, items] of Object.entries(relationData)) {
      const fieldDef = relationFields.get(fieldKey);
      if (!fieldDef?.relType) continue;

      const relationType = fieldDef.relType;

      // Delete existing relations of this type for this entity
      await this.prisma.relation.deleteMany({
        where: {
          fromEntityId: entityId,
          relationType,
        },
      });

      // Create new relations
      if (items.length > 0) {
        await this.prisma.relation.createMany({
          data: items.map(item => ({
            relationType,
            fromEntityId: entityId,
            toEntityId: item.targetId,
            attributes: this.extractRelationAttributes(item) as object,
            updatedBy: actor,
            tenantId: this.tenantContext.getTenantId(),
          })),
        });
      }

      this.logger.debug(`Synced ${items.length} relations of type ${relationType} for entity ${entityId}`);
    }
  }

  /**
   * Extract attributes from relation data (everything except targetId)
   */
  private extractRelationAttributes(item: RelationData): Record<string, unknown> {
    const { targetId, ...attributes } = item;
    return attributes;
  }

  /**
   * Embed relations from the relations table into entity response
   * Handles both outgoing (from this entity) and incoming (to this entity) relations
   */
  async embedRelations(
    entity: EntityRecord,
    relationFields: Map<string, AttributeDefinition>,
  ): Promise<Omit<EntityRecord, 'attributes'> & { attributes: Record<string, unknown> }> {
    const [result] = await this.embedRelationsMany([entity], relationFields);
    return result;
  }

  /**
   * Embed relations for multiple entities efficiently (N+1 safe)
   */
  async embedRelationsMany(
    entities: EntityRecord[],
    relationFields: Map<string, AttributeDefinition>,
  ): Promise<(Omit<EntityRecord, 'attributes'> & { attributes: Record<string, unknown> })[]> {
    if (entities.length === 0) return [];
    if (relationFields.size === 0) {
      return entities.map(e => ({ ...e, attributes: e.attributes as unknown as Record<string, unknown> }));
    }

    const entityIds = entities.map(e => e.id);
    const relationTypes = this.getRelationTypes(relationFields);
    const relationDefinitions = await this.getRelationDefinitions(relationTypes);

    // Fetch relations
    const [outgoingRelations, incomingRelations] = await Promise.all([
      this.fetchRelations(entityIds, relationTypes, 'outgoing'),
      this.fetchRelations(entityIds, relationTypes, 'incoming'),
    ]);

    // Group relations by entity ID and then by type
    const outgoingByEntity = this.groupRelationsByEntityAndType(outgoingRelations, 'fromEntityId');
    const incomingByEntity = this.groupRelationsByEntityAndType(incomingRelations, 'toEntityId');

    return entities.map(entity => {
      const attributes = this.mapRelationsToAttributes(
        entity,
        relationFields,
        relationDefinitions,
        outgoingByEntity,
        incomingByEntity
      );

      return {
        ...entity,
        attributes,
      };
    });
  }

  /**
   * Fetch relations for a given direction
   */
  private async fetchRelations(
    entityIds: string[],
    relationTypes: string[],
    direction: 'incoming' | 'outgoing'
  ): Promise<RelationRecord[]> {
    if (relationTypes.length === 0) return [];

    if (direction === 'outgoing') {
      return this.prisma.relation.findMany({
        where: {
          fromEntityId: { in: entityIds },
          deletedAt: null,
          relationType: { in: relationTypes }
        },
        select: {
          relationType: true,
          fromEntityId: true,
          toEntityId: true,
          attributes: true,
        }
      }) as Promise<RelationRecord[]>;
    } else {
      return this.prisma.relation.findMany({
        where: {
          toEntityId: { in: entityIds },
          deletedAt: null,
          relationType: { in: relationTypes }
        },
        select: {
          relationType: true,
          fromEntityId: true,
          toEntityId: true,
          attributes: true,
        }
      }) as Promise<RelationRecord[]>;
    }
  }

  /**
   * Map relations to entity attributes
   */
  private mapRelationsToAttributes(
    entity: EntityRecord,
    relationFields: Map<string, AttributeDefinition>,
    relationDefinitions: Map<string, RelationDefinitionRecord>,
    outgoingByEntity: Map<string, Map<string, RelationRecord[]>>,
    incomingByEntity: Map<string, Map<string, RelationRecord[]>>
  ): Record<string, unknown> {
    const embeddedAttributes = { ...entity.attributes } as Record<string, unknown>;
    const entityOutgoing = outgoingByEntity.get(entity.id);
    const entityIncoming = incomingByEntity.get(entity.id);

    for (const [fieldKey, fieldDef] of relationFields.entries()) {
      const relType = fieldDef.relType!;
      const relationDef = relationDefinitions.get(relType);
      const direction = this.inferRelationDirection(entity.entityType, fieldDef, relationDef);
      const rels = direction === 'incoming'
        ? (entityIncoming?.get(relType) ?? [])
        : (entityOutgoing?.get(relType) ?? []);

      embeddedAttributes[fieldKey] = rels.map(r => ({
        targetId: direction === 'incoming' ? r.fromEntityId : r.toEntityId,
        ...(r.attributes as Record<string, unknown>),
      }));
    }

    return embeddedAttributes;
  }

  private getRelationTypes(relationFields: Map<string, AttributeDefinition>): string[] {
    return Array.from(
      new Set(
        Array.from(relationFields.values())
          .map(field => field.relType)
          .filter((value): value is string => typeof value === 'string' && value.length > 0)
      )
    );
  }

  private async getRelationDefinitions(
    relationTypes: string[],
  ): Promise<Map<string, RelationDefinitionRecord>> {
    const result = new Map<string, RelationDefinitionRecord>();
    if (relationTypes.length === 0) return result;

    const relationDefinitions = await this.prisma.relationDefinition.findMany({
      where: {
        relationType: { in: relationTypes },
        tenantId: this.tenantContext.getTenantId(),
      },
      select: {
        relationType: true,
        fromEntityType: true,
        toEntityType: true,
      },
    });

    for (const definition of relationDefinitions) {
      result.set(definition.relationType, definition);
    }

    return result;
  }

  private inferRelationDirection(
    entityType: string,
    fieldDef: AttributeDefinition,
    relationDef?: RelationDefinitionRecord,
  ): 'incoming' | 'outgoing' {
    if (fieldDef.side === 'to') return 'incoming';
    if (fieldDef.side === 'from') return 'outgoing';
    if (!relationDef) return 'outgoing';

    const isFrom = relationDef.fromEntityType === entityType;
    const isTo = relationDef.toEntityType === entityType;

    if (isTo && !isFrom) return 'incoming';
    return 'outgoing';
  }

  /**
   * Helper to group relations by entity ID and then by type
   */
  private groupRelationsByEntityAndType(
    relations: RelationRecord[],
    groupByKey: 'fromEntityId' | 'toEntityId'
  ): Map<string, Map<string, RelationRecord[]>> {
    const grouped = new Map<string, Map<string, RelationRecord[]>>();

    for (const rel of relations) {
      const entityId = rel[groupByKey];
      if (!grouped.has(entityId)) {
        grouped.set(entityId, new Map());
      }
      const typeMap = grouped.get(entityId)!;
      if (!typeMap.has(rel.relationType)) {
        typeMap.set(rel.relationType, []);
      }
      typeMap.get(rel.relationType)!.push(rel);
    }
    return grouped;
  }
}
