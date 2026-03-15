import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../../rbac/rbac.service';

/**
 * Decorator to specify required permission for an endpoint.
 */
export const RequirePermission = (permission: 'create' | 'read' | 'update' | 'delete') =>
  Reflector.createDecorator<string>();

/**
 * Guard that checks if the user has permission to perform the requested
 * operation on the specified entity type.
 */
@Injectable()
export class EntityAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const entityType = request.params?.entityType;
    const method = request.method;
    const user = request.user;

    // Skip generic protection if no entityType in route (guard might be applied globally, though it's typically controller-scoped)
    if (!entityType || !user) {
      return true;
    }

    // Map HTTP method to permission
    const operation = this.getOperationFromMethod(method);

    const userId = user.id || user.sub;
    const tenantId = user.tenantId;

    const hasAccess = await this.rbacService.hasPermission(
      userId,
      tenantId,
      'entity',
      entityType,
      operation,
    );

    if (!hasAccess) {
      throw new ForbiddenException(`No ${operation} permission for entity type ${entityType}`);
    }

    return true;
  }

  private getOperationFromMethod(method: string): 'create' | 'read' | 'update' | 'delete' {
    switch (method.toUpperCase()) {
      case 'POST':
        return 'create';
      case 'GET':
        return 'read';
      case 'PATCH':
      case 'PUT':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return 'read';
    }
  }
}

