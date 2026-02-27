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

    // Separate outgoing and incoming relation fields
    const { outgoingFields, incomingFields } = this.separateRelationFields(relationFields);

    // Fetch relations
    const [outgoingRelations, incomingRelations] = await Promise.all([
      this.fetchRelations(entityIds, outgoingFields, 'outgoing'),
      this.fetchRelations(entityIds, incomingFields, 'incoming'),
    ]);

    // Group relations by entity ID and then by type
    const outgoingByEntity = this.groupRelationsByEntityAndType(outgoingRelations, 'fromEntityId');
    const incomingByEntity = this.groupRelationsByEntityAndType(incomingRelations, 'toEntityId');

    return entities.map(entity => {
      const attributes = this.mapRelationsToAttributes(
        entity,
        outgoingFields,
        incomingFields,
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
   * Helper to separate relation fields into outgoing and incoming
   */
  private separateRelationFields(relationFields: Map<string, AttributeDefinition>) {
    const outgoingFields: Array<[string, AttributeDefinition]> = [];
    const incomingFields: Array<[string, AttributeDefinition]> = [];

    for (const [key, field] of relationFields.entries()) {
      if (field.incoming) {
        incomingFields.push([key, field]);
      } else {
        outgoingFields.push([key, field]);
      }
    }

    return { outgoingFields, incomingFields };
  }

  /**
   * Fetch relations for a given direction
   */
  private async fetchRelations(
    entityIds: string[],
    fields: Array<[string, AttributeDefinition]>,
    direction: 'incoming' | 'outgoing'
  ): Promise<RelationRecord[]> {
    if (fields.length === 0) return [];

    const relationTypes = fields.map(([_, f]) => f.relType!);

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
    outgoingFields: Array<[string, AttributeDefinition]>,
    incomingFields: Array<[string, AttributeDefinition]>,
    outgoingByEntity: Map<string, Map<string, RelationRecord[]>>,
    incomingByEntity: Map<string, Map<string, RelationRecord[]>>
  ): Record<string, unknown> {
    const embeddedAttributes = { ...entity.attributes } as Record<string, unknown>;
    const entityOutgoing = outgoingByEntity.get(entity.id);
    const entityIncoming = incomingByEntity.get(entity.id);

    // Add outgoing relations
    for (const [fieldKey, fieldDef] of outgoingFields) {
      const relType = fieldDef.relType!;
      const rels = entityOutgoing?.get(relType) ?? [];
      embeddedAttributes[fieldKey] = rels.map(r => ({
        targetId: r.toEntityId, // Using toEntityId as target for outgoing
        ...(r.attributes as Record<string, unknown>),
      }));
    }

    // Add incoming relations
    for (const [fieldKey, fieldDef] of incomingFields) {
      const relType = fieldDef.relType!;
      const rels = entityIncoming?.get(relType) ?? [];
      embeddedAttributes[fieldKey] = rels.map(r => ({
        targetId: r.fromEntityId, // Using fromEntityId as target for incoming
        ...(r.attributes as Record<string, unknown>),
      }));
    }

    return embeddedAttributes;
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
