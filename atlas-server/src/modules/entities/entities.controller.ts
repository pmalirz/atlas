import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { EntitiesService } from './entities.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { QueryEntitiesDto } from './dto/query-entities.dto';
import { GetEntityQueryDto } from './dto/get-entity.dto';
import { EntityResponse, PaginatedResponse } from './dto/entity-response.dto';
import { EntityAccessGuard } from './guards/entity-access.guard';
import { AttributeAccessInterceptor } from './interceptors/attribute-access.interceptor';

@ApiTags('entities')
@Controller(':slug/entities/:entityType')
@UseGuards(EntityAccessGuard)
@UseInterceptors(AttributeAccessInterceptor)
@ApiParam({ name: 'entityType', description: 'Entity type (e.g., application, it_asset)' })
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new entity' })
  @ApiResponse({ status: 201, description: 'Entity created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid entity type or validation error' })
  async create(
    @Param('entityType') entityType: string,
    @Body() createEntityDto: CreateEntityDto,
  ): Promise<EntityResponse> {
    return this.entitiesService.create(entityType, createEntityDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all entities of a type' })
  @ApiResponse({ status: 200, description: 'List of entities with pagination info' })
  @ApiResponse({ status: 400, description: 'Invalid entity type' })
  async findAll(
    @Param('entityType') entityType: string,
    @Query() query: QueryEntitiesDto,
  ): Promise<PaginatedResponse<EntityResponse>> {
    return this.entitiesService.findAll(entityType, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get entity by ID' })
  @ApiParam({ name: 'id', description: 'Entity UUID' })
  @ApiResponse({ status: 200, description: 'Entity details' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async findOne(
    @Param('entityType') entityType: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetEntityQueryDto,
  ): Promise<EntityResponse> {
    return this.entitiesService.findOne(
      entityType,
      id,
      query.includeDeleted,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update entity' })
  @ApiParam({ name: 'id', description: 'Entity UUID' })
  @ApiResponse({ status: 200, description: 'Entity updated successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async update(
    @Param('entityType') entityType: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEntityDto: UpdateEntityDto,
  ): Promise<EntityResponse> {
    return this.entitiesService.update(entityType, id, updateEntityDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete entity' })
  @ApiParam({ name: 'id', description: 'Entity UUID' })
  @ApiResponse({ status: 204, description: 'Entity deleted successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async remove(
    @Param('entityType') entityType: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.entitiesService.remove(entityType, id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted entity' })
  @ApiParam({ name: 'id', description: 'Entity UUID' })
  @ApiResponse({ status: 200, description: 'Entity restored successfully' })
  @ApiResponse({ status: 400, description: 'Entity is not deleted' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async restore(
    @Param('entityType') entityType: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EntityResponse> {
    return this.entitiesService.restore(entityType, id);
  }
}
