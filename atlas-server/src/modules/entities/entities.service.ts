import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { EntityRepository, EntityRecord } from '../../database/entity.repository';
import { PrismaService } from '../../database/prisma.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { QueryEntitiesDto } from './dto/query-entities.dto';
import { EntityResponse, PaginatedResponse } from './dto/entity-response.dto';
import { SchemaValidatorService } from './validation/schema-validator.service';
import { EntityRelationsService } from './entity-relations.service';

@Injectable()
export class EntitiesService {
  private readonly logger = new Logger(EntitiesService.name);

  constructor(
    private readonly entityRepository: EntityRepository,
    private readonly prisma: PrismaService,
    private readonly schemaValidator: SchemaValidatorService,
    private readonly entityRelations: EntityRelationsService,
  ) { }

  /**
   * Create a new entity with optional attributes and relations
   */
  async create(
    entityType: string,
    dto: CreateEntityDto,
    actor?: string,
  ): Promise<EntityResponse> {
    const { relationFields, regularAttributes, relationData } =
      await this.validateAndExtractRelationData(entityType, dto.attributes, false);

    // Create entity with regular attributes only
    const entity = await this.entityRepository.create({
      entityType,
      name: dto.name,
      description: dto.description,
      attributes: regularAttributes,
      updatedBy: actor,
    });

    // Sync relations to relations table
    await this.entityRelations.syncRelations(entity.id, relationData, relationFields, actor);

    // Return entity with embedded relations
    return this.entityRelations.embedRelations(entity, relationFields);
  }

  /**
   * List entities of a given type with filtering and pagination
   */
  async findAll(
    entityType: string,
    query: QueryEntitiesDto,
  ): Promise<PaginatedResponse<EntityResponse>> {
    const relationFields = await this.validateAndGetRelations(entityType);
    const attributeFilters = query.filter;

    const [entities, total] = await Promise.all([
      this.entityRepository.findMany({
        entityType,
        includeDeleted: query.includeDeleted,
        attributeFilters,
        search: query.search,
        skip: query.skip,
        take: query.take ?? 50,
        orderBy: query.orderBy,
        orderDirection: query.orderDirection,
      }),
      this.entityRepository.count({
        entityType,
        includeDeleted: query.includeDeleted,
        attributeFilters,
        search: query.search,
      }),
    ]);

    // Embed relations into each entity
    const data = await this.entityRelations.embedRelationsMany(entities, relationFields);

    return {
      data,
      total,
      skip: query.skip ?? 0,
      take: query.take ?? 50,
    };
  }

  /**
   * Get a single entity by ID
   */
  async findOne(
    entityType: string,
    id: string,
    includeDeleted = false,
  ): Promise<EntityResponse> {
    const relationFields = await this.validateAndGetRelations(entityType);
    const entity = await this.entityRepository.findByIdOrThrow(id, {
      entityType,
      includeDeleted,
    });

    return this.entityRelations.embedRelations(entity, relationFields);
  }

  /**
   * Update an existing entity
   */
  async update(
    entityType: string,
    id: string,
    dto: UpdateEntityDto,
    actor?: string,
  ): Promise<EntityResponse> {
    const { relationFields, regularAttributes, relationData } =
      await this.validateAndExtractRelationData(entityType, dto.attributes, true);

    // Update entity with regular attributes only
    // Repository handles existence check and type matching
    const entity = await this.entityRepository.update(
      id,
      {
        name: dto.name,
        description: dto.description,
        attributes: Object.keys(regularAttributes).length > 0 ? regularAttributes : undefined,
        updatedBy: actor,
      },
      { mergeAttributes: true, entityType },
    );

    // Sync relations if any relation data was provided
    if (Object.keys(relationData).length > 0) {
      await this.entityRelations.syncRelations(entity.id, relationData, relationFields, actor);
    }

    // Return entity with embedded relations
    return this.entityRelations.embedRelations(entity, relationFields);
  }

  /**
   * Soft delete an entity
   */
  async remove(
    entityType: string,
    id: string,
    actor?: string,
  ): Promise<void> {
    // Validate entity type exists
    await this.schemaValidator.validateEntityType(entityType);

    // Repository handles existence check and type matching
    await this.entityRepository.softDelete(id, actor, entityType);

    // Note: Relations are cascade-deleted by FK constraint
  }

  /**
   * Restore a soft-deleted entity
   */
  async restore(
    entityType: string,
    id: string,
    actor?: string,
  ): Promise<EntityResponse> {
    const relationFields = await this.validateAndGetRelations(entityType);

    // Repository handles existence, type match, and checks if already deleted
    const restored = await this.entityRepository.restore(id, actor, entityType);
    return this.entityRelations.embedRelations(restored, relationFields);
  }

  /**
   * Helper to validate entity type, extract relation data, and validate attributes.
   */
  private async validateAndExtractRelationData(
    entityType: string,
    attributes: Record<string, unknown> | undefined,
    isUpdate: boolean
  ) {
    // Check if entity type exists and get all fields
    const fields = await this.getEntityFieldsOrThrow(entityType);

    const relationFields = this.entityRelations.getRelationFieldsFromDefinitions(fields);

    // Separate relation data from regular attributes
    const { regularAttributes, relationData } = this.entityRelations.extractRelationData(
      attributes ?? {},
      relationFields,
    );

    // Validate regular attributes against schema
    // Ensure validation runs even for empty attributes on create to catch missing required fields
    if (attributes || !isUpdate) {
      await this.schemaValidator.validateEntityAttributes(entityType, attributes ?? {}, isUpdate);
    }

    return { relationFields, regularAttributes, relationData };
  }

  /**
   * Validates the entity type and returns its relation fields.
   * This is a common pattern across many methods.
   */
  private async validateAndGetRelations(entityType: string) {
    const fields = await this.getEntityFieldsOrThrow(entityType);
    return this.entityRelations.getRelationFieldsFromDefinitions(fields);
  }

  /**
   * Helper to fetch entity fields and throw if not found.
   */
  private async getEntityFieldsOrThrow(entityType: string) {
    const fields = await this.schemaValidator.getEntityFields(entityType);
    if (!fields) {
      throw new BadRequestException(`Unknown entity type: "${entityType}"`);
    }
    return fields;
  }

}
