import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { DefinitionsService } from './definitions.service';

@ApiTags('definitions')
@Controller('definitions')
export class DefinitionsController {
    constructor(private readonly definitionsService: DefinitionsService) { }

    // ─────────────────────────────────────────────────────────────
    // Entity Definitions
    // ─────────────────────────────────────────────────────────────

    @Get('entities')
    @ApiOperation({ summary: 'Get all entity definitions' })
    @ApiResponse({ status: 200, description: 'List of all entity definitions' })
    async getAllEntityDefinitions() {
        return this.definitionsService.getAllEntityDefinitions();
    }

    @Get('entities/:entityType')
    @ApiOperation({ summary: 'Get entity definition by type' })
    @ApiParam({ name: 'entityType', description: 'Entity type (e.g., application, it_asset)' })
    @ApiResponse({ status: 200, description: 'Entity definition with field definitions' })
    @ApiResponse({ status: 404, description: 'Definition not found' })
    async getEntityDefinition(@Param('entityType') entityType: string) {
        return this.definitionsService.getEntityDefinition(entityType);
    }

    @Get('entities/:entityType/resolved')
    @ApiOperation({ summary: 'Get entity definition with resolved type references' })
    @ApiParam({ name: 'entityType', description: 'Entity type (e.g., application, it_asset)' })
    @ApiResponse({ status: 200, description: 'Entity definition with resolved field options' })
    @ApiResponse({ status: 404, description: 'Definition not found' })
    async getResolvedEntityDefinition(@Param('entityType') entityType: string) {
        return this.definitionsService.getResolvedEntityDefinition(entityType);
    }

    // ─────────────────────────────────────────────────────────────
    // Type Definitions
    // ─────────────────────────────────────────────────────────────

    @Get('types')
    @ApiOperation({ summary: 'Get all type definitions' })
    @ApiResponse({ status: 200, description: 'List of all type definitions (enums, validation rules)' })
    async getAllTypeDefinitions() {
        return this.definitionsService.getAllTypeDefinitions();
    }

    @Get('types/:typeKey')
    @ApiOperation({ summary: 'Get type definition by key' })
    @ApiParam({ name: 'typeKey', description: 'Type key (e.g., application_status, criticality)' })
    @ApiResponse({ status: 200, description: 'Type definition with options' })
    @ApiResponse({ status: 404, description: 'Type definition not found' })
    async getTypeDefinition(@Param('typeKey') typeKey: string) {
        return this.definitionsService.getTypeDefinition(typeKey);
    }

    // ─────────────────────────────────────────────────────────────
    // Relation Definitions
    // ─────────────────────────────────────────────────────────────

    @Get('relations')
    @ApiOperation({ summary: 'Get all relation definitions' })
    @ApiResponse({ status: 200, description: 'List of all relation definitions' })
    async getAllRelationDefinitions() {
        return this.definitionsService.getAllRelationDefinitions();
    }

    @Get('relations/for-entity/:entityType')
    @ApiOperation({ summary: 'Get relation definitions applicable to an entity type' })
    @ApiParam({ name: 'entityType', description: 'Entity type (e.g., application)' })
    @ApiResponse({ status: 200, description: 'List of relation definitions for the entity type' })
    async getRelationDefinitionsForEntity(@Param('entityType') entityType: string) {
        return this.definitionsService.getRelationDefinitionsForEntity(entityType);
    }

    @Get('relations/:relationType')
    @ApiOperation({ summary: 'Get relation definition by type' })
    @ApiParam({ name: 'relationType', description: 'Relation type (e.g., app_uses_technology)' })
    @ApiResponse({ status: 200, description: 'Relation definition' })
    @ApiResponse({ status: 404, description: 'Relation definition not found' })
    async getRelationDefinition(@Param('relationType') relationType: string) {
        return this.definitionsService.getRelationDefinition(relationType);
    }
}
