import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { WorkflowsService } from './workflows.service';
import { EntitiesService } from '../entities/entities.service';
import type { AuthUser } from '@app-atlas/shared';
import type { UpdateEntityDto } from '../entities/dto/update-entity.dto';
import type { EntityResponse } from '../entities/dto/entity-response.dto';

@Injectable()
export class WorkflowValidationInterceptor implements NestInterceptor {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly entitiesService: EntitiesService,
  ) {}

  private getCurrentState(entity: EntityResponse, field: string): unknown {
    const attributeValue = entity.attributes[field];
    if (attributeValue !== undefined) {
      return attributeValue;
    }

    if (field in entity) {
      return entity[field as keyof EntityResponse];
    }

    return undefined;
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      params?: { entityType?: string; id?: string };
      body?: UpdateEntityDto;
      user?: AuthUser;
    }>();

    const { params, body, user } = request;

    if (request.method !== 'PATCH') {
      return next.handle();
    }

    const entityType = params?.entityType;
    const id = params?.id;
    if (!entityType || !id || !body || !body.attributes || !user?.tenantId) {
      return next.handle(); // Not an entity attributes update or missing data
    }

    const tenantId = user.tenantId;

    // Fetch workflows for this entity type
    const workflows = await this.workflowsService.getWorkflowDefinitions(tenantId, entityType);
    if (!workflows || workflows.length === 0) {
      return next.handle(); // No workflows to enforce
    }

    let entityInfo: EntityResponse | null = null;

    for (const wf of workflows) {
      // Check if the governed field is being updated
      if (wf.field in body.attributes) {
        const targetState = body.attributes[wf.field];

        if (typeof targetState !== 'string') {
          throw new BadRequestException(`Workflow field '${wf.field}' requires a string transition target`);
        }
        
        // Lazy fetch the entity only if needed
        if (!entityInfo) {
          entityInfo = await this.entitiesService.findOne(entityType, id);
          if (!entityInfo) {
            throw new NotFoundException(`Entity ${id} not found`);
          }
        }

        const currentState = this.getCurrentState(entityInfo, wf.field);

        // Only enforce if the state is actually changing
        if (targetState !== currentState) {
          const isAllowed = await this.workflowsService.evaluateTransition(
            entityInfo,
            wf,
            user,
            targetState
          );

          if (!isAllowed) {
            throw new ForbiddenException(
              `Update denied: You do not have permission or conditions are not met to transition '${wf.field}' to '${targetState}'.`
            );
          }
        }
      }
    }

    return next.handle();
  }
}
