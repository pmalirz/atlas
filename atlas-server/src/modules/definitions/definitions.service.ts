import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EntityDefinition, TypeDefinition, RelationDefinition } from '@prisma/client';
import { z } from 'zod';
import {
    AttributeDefinitionArraySchema,
} from '@app-atlas/shared';
import {
    AttributeDefinition,
    EntityDefinitionResponse,
    ResolvedAttributeDefinition,
    ResolvedEntityDefinition,
    TypeDefinitionResponse,
    RelationDefinitionResponse
} from './types';

// Export types for consumers that might still import from service (though they should use types.ts)
export {
    AttributeDefinition,
    EntityDefinitionResponse,
    ResolvedAttributeDefinition,
    ResolvedEntityDefinition,
    TypeDefinitionResponse,
    RelationDefinitionResponse
};


// ─────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────

@Injectable()
export class DefinitionsService {
    constructor(private readonly prisma: PrismaService) { }

    // ─────────────────────────────────────────────────────────────
    // Entity Definitions
    // ─────────────────────────────────────────────────────────────

    async getAllEntityDefinitions(): Promise<EntityDefinitionResponse[]> {
        const definitions = await this.prisma.entityDefinition.findMany({
            orderBy: { displayName: 'asc' },
        });

        return definitions.map((d: EntityDefinition) => this.mapEntityDefinition(d));
    }

    async getEntityDefinition(entityType: string): Promise<EntityDefinitionResponse> {
        const definition = await this.prisma.entityDefinition.findUnique({
            where: { entityType },
        });

        if (!definition) {
            throw new NotFoundException(`Entity definition for "${entityType}" not found`);
        }

        return this.mapEntityDefinition(definition);
    }

    async getResolvedEntityDefinition(entityType: string): Promise<ResolvedEntityDefinition> {
        const definition = await this.getEntityDefinition(entityType);
        const typeDefinitions = await this.getAllTypeDefinitions();
        const typeMap = new Map(typeDefinitions.map((t) => [t.typeKey, t]));

        const resolvedAttributes: ResolvedAttributeDefinition[] = definition.attributes.map((attr) => {
            if (attr.typeRef) {
                const typeDef = typeMap.get(attr.typeRef);
                if (typeDef) {
                    return {
                        ...attr,
                        resolvedOptions: typeDef.options ?? undefined,
                        resolvedBaseType: typeDef.baseType,
                    };
                }
            }
            return attr;
        });

        return {
            ...definition,
            resolvedAttributes,
        };
    }

    private readonly logger = new Logger(DefinitionsService.name);

    private mapEntityDefinition(definition: {
        id: string;
        entityType: string;
        displayName: string;
        attributeSchema: unknown;
        createdAt: Date;
        updatedAt: Date;
    }): EntityDefinitionResponse {
        // Validate the fields JSON content using Zod schema
        const fieldsResult = AttributeDefinitionArraySchema.safeParse(definition.attributeSchema);

        if (!fieldsResult.success) {
            // Log validation issues but don't throw - allows backward compatibility
            this.logger.warn(
                `EntityDefinition "${definition.entityType}" has invalid fields JSON: ` +
                fieldsResult.error.issues.map((i: z.ZodIssue) => `${i.path.join('.')}: ${i.message}`).join(', ')
            );
        }

        return {
            id: definition.id,
            entityType: definition.entityType,
            displayName: definition.displayName,
            // Use validated data if available, fallback to raw cast if validation failed
            attributes: fieldsResult.success
                ? fieldsResult.data
                : (definition.attributeSchema as AttributeDefinition[]) ?? [],
            createdAt: definition.createdAt,
            updatedAt: definition.updatedAt,
        };
    }

    // ─────────────────────────────────────────────────────────────
    // Type Definitions
    // ─────────────────────────────────────────────────────────────

    async getAllTypeDefinitions(): Promise<TypeDefinitionResponse[]> {
        const types = await this.prisma.typeDefinition.findMany({
            orderBy: { displayName: 'asc' },
        });

        return types.map((t: TypeDefinition) => ({
            id: t.id,
            typeKey: t.typeKey,
            displayName: t.displayName,
            baseType: t.baseType,
            options: t.options as string[] | null,
            validation: t.validation as Record<string, unknown> | null,
        }));
    }

    async getTypeDefinition(typeKey: string): Promise<TypeDefinitionResponse> {
        const type = await this.prisma.typeDefinition.findUnique({
            where: { typeKey },
        });

        if (!type) {
            throw new NotFoundException(`Type definition "${typeKey}" not found`);
        }

        return {
            id: type.id,
            typeKey: type.typeKey,
            displayName: type.displayName,
            baseType: type.baseType,
            options: type.options as string[] | null,
            validation: type.validation as Record<string, unknown> | null,
        };
    }

    // ─────────────────────────────────────────────────────────────
    // Relation Definitions
    // ─────────────────────────────────────────────────────────────

    async getAllRelationDefinitions(): Promise<RelationDefinitionResponse[]> {
        const definitions = await this.prisma.relationDefinition.findMany({
            orderBy: { displayName: 'asc' },
        });

        return definitions.map((d: RelationDefinition) => ({
            id: d.id,
            relationType: d.relationType,
            displayName: d.displayName,
            fromEntityType: d.fromEntityType,
            toEntityType: d.toEntityType,
            isDirectional: d.isDirectional,
            attributeSchema: d.attributeSchema as AttributeDefinition[] | null,
        }));
    }

    async getRelationDefinition(relationType: string): Promise<RelationDefinitionResponse> {
        const definition = await this.prisma.relationDefinition.findUnique({
            where: { relationType },
        });

        if (!definition) {
            throw new NotFoundException(`Relation definition "${relationType}" not found`);
        }

        return {
            id: definition.id,
            relationType: definition.relationType,
            displayName: definition.displayName,
            fromEntityType: definition.fromEntityType,
            toEntityType: definition.toEntityType,
            isDirectional: definition.isDirectional,
            attributeSchema: definition.attributeSchema as AttributeDefinition[] | null,
        };
    }

    async getRelationDefinitionsForEntity(entityType: string): Promise<RelationDefinitionResponse[]> {
        const allDefinitions = await this.getAllRelationDefinitions();

        return allDefinitions.filter((d) => {
            return d.fromEntityType === entityType || d.toEntityType === entityType;
        });
    }
}
