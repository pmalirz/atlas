import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { WorkflowsService } from './workflows.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../../database';
import { EntitiesService } from '../entities/entities.service';
import type { AuthUser } from '@app-atlas/shared';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { UpdateEntityDto } from '../entities/dto/update-entity.dto';
import type { EntityResponse } from '../entities/dto/entity-response.dto';

type WorkflowTransition = {
  name?: string;
  from?: string[];
  to: string;
  condition?: string;
};

type WorkflowConfig = {
  transitions: WorkflowTransition[];
};

class ExecuteTransitionDto {
  @IsUUID()
  entityId: string;

  @IsOptional()
  @IsUUID()
  workflowId?: string;

  @IsOptional()
  @IsString()
  workflowDefinitionName?: string;

  @IsOptional()
  @IsString()
  transitionName?: string;

  @IsOptional()
  @IsString()
  toState?: string;
}

@ApiTags('workflows')
@Controller(':slug/workflows')
export class WorkflowsController {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly prisma: PrismaService,
    private readonly entitiesService: EntitiesService,
  ) {}

  private isWorkflowTransition(transition: unknown): transition is WorkflowTransition {
    if (!transition || typeof transition !== 'object') {
      return false;
    }

    const candidate = transition as Partial<WorkflowTransition>;

    if (candidate.name !== undefined && typeof candidate.name !== 'string') {
      return false;
    }

    if (typeof candidate.to !== 'string') {
      return false;
    }

    if (
      candidate.from !== undefined &&
      (!Array.isArray(candidate.from) || candidate.from.some((state) => typeof state !== 'string'))
    ) {
      return false;
    }

    if (candidate.condition !== undefined && typeof candidate.condition !== 'string') {
      return false;
    }

    return true;
  }

  private isWorkflowConfig(config: unknown): config is WorkflowConfig {
    if (!config || typeof config !== 'object') {
      return false;
    }

    const candidate = config as { transitions?: unknown };
    return Array.isArray(candidate.transitions) && candidate.transitions.every((transition) => this.isWorkflowTransition(transition));
  }

  private getCurrentState(entity: EntityResponse, field: string): unknown {
    return entity.attributes[field] ?? entity[field as keyof EntityResponse];
  }

  @Post('transitions/execute')
  @ApiOperation({ summary: 'Execute a workflow transition on an entity' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiResponse({ status: 200, description: 'Transition executed successfully' })
  @ApiResponse({ status: 403, description: 'Transition not allowed by rule engine' })
  async executeTransition(
    @Param('slug') slug: string,
    @Body() dto: ExecuteTransitionDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (!dto.entityId) {
      throw new BadRequestException('entityId is required');
    }
    if (!dto.transitionName && !dto.toState) {
      throw new BadRequestException('Either transitionName or toState is required');
    }
    if (!dto.workflowId && !dto.workflowDefinitionName) {
      throw new BadRequestException('Either workflowId or workflowDefinitionName is required');
    }

    // Resolve tenant
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    // Find the workflow definition
    const workflowDef = await this.prisma.workflowDefinition.findFirst({
      where: {
        tenantId: tenant.id,
        ...(dto.workflowId ? { id: dto.workflowId } : { name: dto.workflowDefinitionName }),
      },
    });

    if (!workflowDef) {
      throw new NotFoundException('Workflow definition not found');
    }

    // Get the entity
    const entity = await this.entitiesService.findOne(workflowDef.entityType, dto.entityId);
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }

    const rawConfig = workflowDef.config;
    if (!this.isWorkflowConfig(rawConfig)) {
      throw new BadRequestException('Invalid workflow configuration');
    }
    const config = rawConfig;

    // Determine current state
    const currentState = this.getCurrentState(entity, workflowDef.field);

    // Find requested transition
    let targetTransition: WorkflowTransition | undefined;
    if (dto.transitionName) {
      targetTransition = config.transitions.find((transition) => transition.name === dto.transitionName);
    } else {
      // Find by toState and matching current state
      targetTransition = config.transitions.find((transition) => {
        if (transition.to !== dto.toState) return false;
        if (!transition.from || transition.from.length === 0) return true;
        return typeof currentState === 'string' && transition.from.includes(currentState);
      });
    }

    if (!targetTransition) {
      throw new BadRequestException('Transition not found or not applicable from current state');
    }

    // Ensure the transition is allowed using evaluateTransition logic
    const isAllowed = await this.workflowsService.evaluateTransition(
      entity,
      workflowDef,
      user,
      targetTransition.to
    );

    if (!isAllowed) {
      throw new ForbiddenException(`Transition to '${targetTransition.to}' is not allowed by workflow rules.`);
    }

    // Execute the update
    const updatePayload = {
      attributes: {
        [workflowDef.field]: targetTransition.to,
      },
    };

    return this.entitiesService.update(workflowDef.entityType, dto.entityId, updatePayload as UpdateEntityDto, user.id);
  }

  @Get('entities/:entityType/:id/allowed-transitions')
  @ApiOperation({ summary: 'Get allowed workflow transitions for an entity' })
  @ApiParam({ name: 'slug', description: 'Tenant slug' })
  @ApiParam({ name: 'entityType', description: 'Entity Type' })
  @ApiParam({ name: 'id', description: 'Entity UUID' })
  @ApiResponse({ status: 200, description: 'Map of field to array of allowed target states' })
  async getAllowedTransitions(
    @Param('slug') slug: string,
    @Param('entityType') entityType: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<Record<string, string[]>> {
    // Resolve tenant
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const entity = await this.entitiesService.findOne(entityType, id);
    if (!entity) {
      throw new NotFoundException('Entity not found');
    }

    const workflows = await this.workflowsService.getWorkflowDefinitions(tenant.id, entityType);
    
    // Result object: { "status": ["approved", "rejected"], "otherField": ["state_b"] }
    const allowedTransitions: Record<string, string[]> = {};

    for (const wf of workflows) {
      const rawConfig = wf.config;
      if (!this.isWorkflowConfig(rawConfig)) {
        continue;
      }

      const config = rawConfig;

      const currentState = this.getCurrentState(entity, wf.field);
      const validTargets = new Set<string>();

      for (const transition of config.transitions) {
        // Must match 'from' state
        const matchFrom =
          !transition.from ||
          transition.from.length === 0 ||
          (typeof currentState === 'string' && transition.from.includes(currentState));

        if (matchFrom) {
          // Check condition
          if (await this.workflowsService.evaluateTransition(entity, wf, user, transition.to)) {
            validTargets.add(transition.to);
          }
        }
      }

      allowedTransitions[wf.field] = Array.from(validTargets);
    }

    return allowedTransitions;
  }
}

