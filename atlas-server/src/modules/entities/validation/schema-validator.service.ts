import { Injectable, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../../../database/prisma.service';
import { TenantContextService } from '../../../common/services/tenant-context.service';
import { ZodSchemaFactory } from './zod-schema-factory';
import {
  AttributeDefinition,
  TypeDefinition,
  RelationDefinitionData,
  StringTypeValidator,
  NumberTypeValidator,
  BooleanTypeValidator,
  DateTypeValidator,
  EnumTypeValidator,
  RelationTypeValidator,
} from './type-validators';

/**
 * Validation error structure returned to clients
 */
interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Options for cache management
 */
interface CacheOptions {
  /** Time-to-live in milliseconds (default: 5 minutes) */
  ttl?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * SchemaValidatorService - Dynamic entity attribute validation
 * 
 * Uses the Strategy Pattern with Zod for type-safe, extensible validation.
 * Field definitions are loaded from EntitySchema table in the database.
 * Type definitions (enums, validation rules) are loaded from TypeDefinition table.
 * Relation definitions are loaded from RelationDefinition table.
 * 
 * Key features:
 * - **Data-driven**: Validation rules come from the database, not code
 * - **Extensible**: Add new type validators without modifying this class (OCP)
 * - **Relation support**: Validates relation fields with attribute schemas
 * - **Cacheable**: Schemas and types are cached with TTL for performance
 * - **Type-safe**: Full Zod integration with proper TypeScript inference
 */
@Injectable()
export class SchemaValidatorService implements OnModuleInit {
  private readonly logger = new Logger(SchemaValidatorService.name);

  // Caches with TTL support
  private readonly schemaCache = new Map<string, CacheEntry<AttributeDefinition[]>>();
  private readonly typeCache = new Map<string, CacheEntry<TypeDefinition>>();
  private readonly relationDefCache = new Map<string, CacheEntry<RelationDefinitionData>>();

  // Schema factory with registered validators
  private readonly schemaFactory: ZodSchemaFactory;

  // Default cache TTL: 5 minutes
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000;

  // Core entity fields that are stored in columns, not in JSONB attributes
  private static readonly CORE_FIELDS = new Set(['name', 'description']);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {
    this.schemaFactory = new ZodSchemaFactory();
  }

  /**
   * Initialize validators on module startup
   */
  onModuleInit(): void {
    // Register all built-in type validators (sorted by priority internally)
    this.schemaFactory.registerValidator(new StringTypeValidator());
    this.schemaFactory.registerValidator(new NumberTypeValidator());
    this.schemaFactory.registerValidator(new BooleanTypeValidator());
    this.schemaFactory.registerValidator(new DateTypeValidator());
    this.schemaFactory.registerValidator(new EnumTypeValidator());
    this.schemaFactory.registerValidator(new RelationTypeValidator());

    this.logger.log(
      `Initialized with ${this.schemaFactory.getValidators().length} type validators`
    );
  }

  /**
   * Validate if an entity type exists
   *
   * @param entityType - The entity type to check
   * @throws BadRequestException if the entity type does not exist
   */
  async validateEntityType(entityType: string): Promise<void> {
    const fields = await this.getEntityFields(entityType);
    if (!fields) {
      throw new BadRequestException(`Unknown entity type: "${entityType}"`);
    }
  }

  /**
   * Validate entity attributes against the schema defined in the database
   * 
   * @param entityType - The entity type (e.g., 'application', 'it_asset')
   * @param attributes - The attributes object to validate (from request body)
   * @param isUpdate - If true, all fields become optional (partial validation)
   * @param options.strictMode - If false (default), allow unknown attributes
   * 
   * @throws BadRequestException with structured errors if validation fails
   */
  async validateEntityAttributes(
    entityType: string,
    attributes: Record<string, unknown>,
    isUpdate = false,
    options: { strictMode?: boolean } = {}
  ): Promise<void> {
    // strictMode=true by default: reject unknown fields not defined in schema
    const { strictMode = true } = options;

    // Load field definitions for this entity type
    const fields = await this.getEntityFields(entityType);
    if (!fields || fields.length === 0) {
      this.logger.debug(`No schema defined for entity type: ${entityType}, skipping validation`);
      return;
    }

    // Load all referenced type definitions (for enums etc.)
    const typeRefs = this.extractTypeRefs(fields);
    const typeDefinitions = await this.getTypeDefinitions(typeRefs);

    // Load all referenced relation definitions (for relation fields)
    const relTypes = this.extractRelTypes(fields);
    const relationDefinitions = await this.getRelationDefinitions(relTypes);

    // Also load type definitions needed by relation attributeSchemas
    const relAttrTypeRefs = this.extractRelationAttributeTypeRefs(relationDefinitions);
    const relAttrTypes = await this.getTypeDefinitions(relAttrTypeRefs);

    // Merge all type definitions
    for (const [key, value] of relAttrTypes) {
      typeDefinitions.set(key, value);
    }

    // Build dynamic Zod schema
    const zodSchema = this.schemaFactory.buildEntitySchema(
      fields,
      typeDefinitions,
      relationDefinitions,
      {
        isPartial: isUpdate,
        strictMode,
        skipDeprecated: false,
      }
    );

    // Validate attributes
    const result = zodSchema.safeParse(attributes);

    if (!result.success) {
      const errors = this.formatZodErrors(result.error);
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }
  }

  /**
   * Get the raw Zod schema for an entity type (useful for testing/inspection)
   */
  async getEntityZodSchema(entityType: string, isPartial = false) {
    const fields = await this.getEntityFields(entityType);
    if (!fields) return null;

    const typeRefs = this.extractTypeRefs(fields);
    const typeDefinitions = await this.getTypeDefinitions(typeRefs);

    const relTypes = this.extractRelTypes(fields);
    const relationDefinitions = await this.getRelationDefinitions(relTypes);

    return this.schemaFactory.buildEntitySchema(fields, typeDefinitions, relationDefinitions, {
      isPartial,
      strictMode: true,
    });
  }

  /**
   * Validate relation attributes against the attributeSchema defined in RelationDefinition
   * 
   * @param relationType - The relation type (e.g., 'book_written_by')
   * @param attributes - The attributes object to validate (from request body)
   * @param isUpdate - If true, required fields become optional (partial validation)
   * 
   * @throws BadRequestException with structured errors if validation fails
   */
  async validateRelationAttributes(
    relationType: string,
    attributes: Record<string, unknown> | undefined,
    isUpdate = false
  ): Promise<void> {
    // If no attributes provided for create, that's okay (attributes are optional on relations)
    if (!attributes || Object.keys(attributes).length === 0) {
      return;
    }

    // Load relation definition
    const relationDefs = await this.getRelationDefinitions([relationType]);
    const relationDef = relationDefs.get(relationType);

    if (!relationDef || !relationDef.attributeSchema || relationDef.attributeSchema.length === 0) {
      // No attribute schema defined for this relation type, skip validation
      this.logger.debug(`No attributeSchema defined for relation type: ${relationType}, skipping validation`);
      return;
    }

    const fields = relationDef.attributeSchema;

    // Load all referenced type definitions (for enums etc.)
    const typeRefs = this.extractTypeRefs(fields);
    const typeDefinitions = await this.getTypeDefinitions(typeRefs);

    // Build dynamic Zod schema for relation attributes
    // Using empty relation definitions map since we're validating relation attributes, not entity relation fields
    const zodSchema = this.schemaFactory.buildEntitySchema(
      fields,
      typeDefinitions,
      new Map(), // No nested relations in relation attributes
      {
        isPartial: isUpdate,
        strictMode: true,
        skipDeprecated: false,
      }
    );

    // Validate attributes
    const result = zodSchema.safeParse(attributes);

    if (!result.success) {
      const errors = this.formatZodErrors(result.error);
      throw new BadRequestException({
        message: 'Relation attribute validation failed',
        errors,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Private: Data Loading with TTL Cache
  // ---------------------------------------------------------------------------

  public async getEntityFields(
    entityType: string,
    options: CacheOptions = {}
  ): Promise<AttributeDefinition[] | null> {
    const ttl = options.ttl ?? this.DEFAULT_CACHE_TTL;

    const cached = this.schemaCache.get(entityType);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    const tenantId = this.tenantContext.getTenantId();
    const definition = await this.prisma.entityDefinition.findUnique({
      where: { entity_definitions_type_tenant_unique: { entityType, tenantId } },
    });

    if (!definition) {
      return null;
    }

    const fields = definition.attributeSchema as unknown as AttributeDefinition[];

    this.schemaCache.set(entityType, {
      data: fields,
      timestamp: Date.now(),
    });

    return fields;
  }

  private async getTypeDefinitions(
    typeKeys: string[]
  ): Promise<Map<string, TypeDefinition>> {
    const result = new Map<string, TypeDefinition>();
    if (typeKeys.length === 0) return result;

    const keysToFetch: string[] = [];

    for (const key of typeKeys) {
      const cached = this.typeCache.get(key);
      if (cached && Date.now() - cached.timestamp < this.DEFAULT_CACHE_TTL) {
        result.set(key, cached.data);
      } else {
        keysToFetch.push(key);
      }
    }

    if (keysToFetch.length > 0) {
      const typeDefs = await this.prisma.typeDefinition.findMany({
        where: { typeKey: { in: keysToFetch } },
      });

      for (const typeDef of typeDefs) {
        const entry: TypeDefinition = {
          typeKey: typeDef.typeKey,
          baseType: typeDef.baseType,
          options: typeDef.options as TypeDefinition['options'],
          validation: typeDef.validation as Record<string, unknown> | null,
        };

        result.set(typeDef.typeKey, entry);
        this.typeCache.set(typeDef.typeKey, {
          data: entry,
          timestamp: Date.now(),
        });
      }
    }

    return result;
  }

  private async getRelationDefinitions(
    relTypes: string[]
  ): Promise<Map<string, RelationDefinitionData>> {
    const result = new Map<string, RelationDefinitionData>();
    if (relTypes.length === 0) return result;

    const keysToFetch: string[] = [];

    for (const key of relTypes) {
      const cached = this.relationDefCache.get(key);
      if (cached && Date.now() - cached.timestamp < this.DEFAULT_CACHE_TTL) {
        result.set(key, cached.data);
      } else {
        keysToFetch.push(key);
      }
    }

    if (keysToFetch.length > 0) {
      const relDefs = await this.prisma.relationDefinition.findMany({
        where: { relationType: { in: keysToFetch } },
      });

      for (const relDef of relDefs) {
        const entry: RelationDefinitionData = {
          relationType: relDef.relationType,
          displayName: relDef.displayName,
          fromEntityType: relDef.fromEntityType,
          toEntityType: relDef.toEntityType,
          attributeSchema: relDef.attributeSchema as AttributeDefinition[] | null,
        };

        result.set(relDef.relationType, entry);
        this.relationDefCache.set(relDef.relationType, {
          data: entry,
          timestamp: Date.now(),
        });
      }
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // Private: Helpers
  // ---------------------------------------------------------------------------

  /**
   * Extract all typeRef values from field definitions
   */
  private extractTypeRefs(fields: AttributeDefinition[]): string[] {
    return fields
      .filter(f => f.typeRef && !SchemaValidatorService.CORE_FIELDS.has(f.key))
      .map(f => f.typeRef!);
  }

  /**
   * Extract all relType values from field definitions
   */
  private extractRelTypes(fields: AttributeDefinition[]): string[] {
    return fields
      .filter(f => f.type === 'relation' && f.relType)
      .map(f => f.relType!);
  }

  /**
   * Extract typeRefs from relation attribute schemas
   */
  private extractRelationAttributeTypeRefs(
    relationDefs: Map<string, RelationDefinitionData>
  ): string[] {
    const typeRefs: string[] = [];
    for (const relDef of relationDefs.values()) {
      if (relDef.attributeSchema) {
        for (const attr of relDef.attributeSchema) {
          if (attr.typeRef) {
            typeRefs.push(attr.typeRef);
          }
        }
      }
    }
    return typeRefs;
  }

  /**
   * Format Zod errors into our ValidationError structure
   */
  private formatZodErrors(error: z.ZodError): ValidationError[] {
    return error.issues.map((issue) => ({
      field: issue.path.join('.') || 'root',
      message: issue.message,
      code: issue.code,
    }));
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.schemaCache.clear();
    this.typeCache.clear();
    this.relationDefCache.clear();
    this.logger.debug('All caches cleared');
  }

  /**
   * Invalidate cache for a specific entity type
   */
  invalidateEntityCache(entityType: string): void {
    this.schemaCache.delete(entityType);
  }

  /**
   * Invalidate cache for a specific type definition
   */
  invalidateTypeCache(typeKey: string): void {
    this.typeCache.delete(typeKey);
  }

  /**
   * Invalidate cache for a specific relation definition
   */
  invalidateRelationDefCache(relationType: string): void {
    this.relationDefCache.delete(relationType);
  }
}

