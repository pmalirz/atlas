import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { RelationsService } from './relations.service';
import { CreateRelationDto, UpdateRelationDto, GetRelationsDto, GetRelationGraphDto } from './dto';

@ApiTags('relations')
@Controller(':slug/relations')
export class RelationsController {
  constructor(private readonly relationsService: RelationsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new relation between entities' })
  @ApiResponse({ status: 201, description: 'Relation created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() createDto: CreateRelationDto) {
    return this.relationsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all relations with optional filters' })
  @ApiResponse({ status: 200, description: 'List of relations' })
  findAll(@Query() query: GetRelationsDto) {
    return this.relationsService.findAll(query);
  }

  @Get('graph/:entityId')
  @ApiOperation({ summary: 'Get relations for graph visualization with depth traversal' })
  @ApiResponse({ status: 200, description: 'Graph relations with entities' })
  @ApiParam({ name: 'entityId', description: 'Center entity ID (UUID)' })
  getGraph(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Query() query: GetRelationGraphDto,
  ) {
    return this.relationsService.getGraphData(entityId, {
      depth: query.depth,
      excludeRelations: query.exclude,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get relation by ID' })
  @ApiResponse({ status: 200, description: 'Relation found' })
  @ApiResponse({ status: 404, description: 'Relation not found' })
  @ApiParam({ name: 'id', description: 'Relation ID (UUID)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.relationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a relation' })
  @ApiResponse({ status: 200, description: 'Relation updated successfully' })
  @ApiResponse({ status: 404, description: 'Relation not found' })
  @ApiParam({ name: 'id', description: 'Relation ID (UUID)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateRelationDto,
  ) {
    return this.relationsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a relation (soft delete)' })
  @ApiResponse({ status: 204, description: 'Relation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Relation not found' })
  @ApiParam({ name: 'id', description: 'Relation ID (UUID)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.relationsService.remove(id);
  }
}
