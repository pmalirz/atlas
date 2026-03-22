import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database';
import { RbacService } from '../rbac/rbac.service';
import type { EntityResponse } from '../entities/dto/entity-response.dto';
import type { AuthTokenPayload, AuthUser } from '@app-atlas/shared';
import * as vm from 'vm';

type WorkflowAuthContext = Partial<Pick<AuthUser, 'id' | 'tenantId'>> &
  Partial<Pick<AuthTokenPayload, 'sub'>> & {
  userId?: string;
  roles?: unknown;
};

type WorkflowTransition = {
  name?: string;
  from?: string[];
  to: string;
  condition?: string;
};

type WorkflowConfig = {
  transitions: WorkflowTransition[];
};

type WorkflowDefinitionLike = {
  id?: string;
  field: string;
  config?: unknown;
};

type WorkflowEntity = Pick<EntityResponse, 'attributes'> & Partial<Omit<EntityResponse, 'attributes'>>;

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);
  private readonly conditionEvaluationTimeoutMs = 100;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rbacService: RbacService,
  ) {}

  async getWorkflowDefinitions(tenantId: string, entityType: string) {
    return this.prisma.workflowDefinition.findMany({
      where: {
        tenantId,
        entityType,
      },
    });
  }

  private extractRoleNames(roles: unknown): string[] {
    if (!Array.isArray(roles)) {
      return [];
    }

    return roles.filter((role): role is string => typeof role === 'string' && role.length > 0);
  }

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

  private getTopLevelFieldValue(entity: WorkflowEntity, field: string): unknown {
    if (field in entity) {
      return entity[field as keyof WorkflowEntity];
    }

    return undefined;
  }

  private cloneForSandbox<T>(value: T): T {
    if (value === null || value === undefined || typeof value !== 'object') {
      return value;
    }

    const structuredCloneFn = (globalThis as { structuredClone?: <Input>(input: Input) => Input }).structuredClone;
    if (typeof structuredCloneFn === 'function') {
      return structuredCloneFn(value);
    }

    return JSON.parse(JSON.stringify(value)) as T;
  }

  private async resolveAuthRoles(authContext: WorkflowAuthContext): Promise<string[]> {
    const currentRoles = this.extractRoleNames(authContext.roles);
    if (currentRoles.length > 0) {
      return currentRoles;
    }

    const userId = authContext.userId ?? authContext.id ?? authContext.sub;
    const tenantId = authContext.tenantId;

    if (!userId || !tenantId) {
      authContext.roles = currentRoles;
      this.logger.warn('Unable to hydrate workflow auth roles because user id or tenant id is missing');
      return currentRoles;
    }

    const userRolesContext = await this.rbacService.getUserRoles(userId, tenantId);
    const hydratedRoles = userRolesContext.roles
      .map((role) => role.name)
      .filter((role): role is string => typeof role === 'string' && role.length > 0);

    authContext.roles = hydratedRoles;
    return hydratedRoles;
  }

  async evaluateTransition(
    entity: WorkflowEntity,
    workflowDef: WorkflowDefinitionLike,
    authContext: WorkflowAuthContext | undefined,
    targetState: string
  ): Promise<boolean> {
    const rawConfig = workflowDef.config;
    if (!this.isWorkflowConfig(rawConfig)) {
      this.logger.warn(`Workflow ${workflowDef.id} has no valid transitions configuration`);
      return false; // Assuming default deny if workflow config is invalid
    }

    const config = rawConfig;

    // Determine current state of the governed field
    const currentState =
      entity.attributes[workflowDef.field] ?? this.getTopLevelFieldValue(entity, workflowDef.field);

    // Find applicable transitions
    const transitions = config.transitions.filter((t) => {
      // Must match target state
      if (t.to !== targetState) return false;
      // Must match 'from' state or be a wildcard (null/empty or array including currentState)
      if (!t.from || t.from.length === 0) return true;
      return typeof currentState === 'string' && t.from.includes(currentState);
    });

    if (transitions.length === 0) {
      this.logger.debug(`No valid transition found for ${workflowDef.field} from ${currentState} to ${targetState}`);
      return false;
    }

    const effectiveAuthContext: WorkflowAuthContext = authContext
      ? {
          ...authContext,
          roles: Array.isArray(authContext.roles) ? [...authContext.roles] : authContext.roles,
        }
      : {};
    let resolvedRoles: string[] | null = null;

    // Evaluate conditions for found transitions. If any evaluates to true, transition is allowed.
    for (const transition of transitions) {
      if (!transition.condition) {
        return true; // No condition means always allowed
      }

      try {
        if (resolvedRoles === null) {
          resolvedRoles = await this.resolveAuthRoles(effectiveAuthContext);
        }

        const sandbox = {
          $entity: this.cloneForSandbox(entity),
          $auth: this.cloneForSandbox({
            ...effectiveAuthContext,
            roles: resolvedRoles,
          }),
        };
        // TODO: EVALUATION ENGINE - should be replaced with a more secure and performant solution (vs running JS fragment, what is conveninent and secure if only the developer can write the condition)
        vm.createContext(sandbox);
        const result = vm.runInContext(transition.condition, sandbox, {
          timeout: this.conditionEvaluationTimeoutMs,
        });
        
        if (result === true) {
          return true; // Match found
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to evaluate condition for transition '${transition.name}': ${errorMessage}`);
      }
    }

    return false;
  }
}
