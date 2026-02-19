import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Entity access permissions by operation type.
 * This is a placeholder structure that will be populated from
 * user roles/claims when authentication is implemented.
 */
export interface EntityPermissions {
  entityType: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

/**
 * Decorator to specify required permission for an endpoint.
 */
export const RequirePermission = (permission: 'create' | 'read' | 'update' | 'delete') =>
  Reflector.createDecorator<string>();

/**
 * Guard that checks if the user has permission to perform the requested
 * operation on the specified entity type.
 * 
 * Currently, this guard is permissive (allows all operations).
 * When authentication is implemented:
 * 1. Extract user from JWT token
 * 2. Load user's role-based permissions
 * 3. Check if user has permission for entityType + operation
 */
@Injectable()
export class EntityAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const entityType = request.params?.entityType;
    const method = request.method;

    // Map HTTP method to permission
    const operation = this.getOperationFromMethod(method);

    // TODO: When auth is implemented, check user permissions here
    // const user = request.user;
    // const permissions = await this.getPermissions(user, entityType);
    // if (!this.hasPermission(permissions, operation)) {
    //   throw new ForbiddenException(`No ${operation} permission for ${entityType}`);
    // }

    // For now, allow all operations
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

  // Placeholder for future implementation
  // private async getPermissions(user: any, entityType: string): Promise<EntityPermissions> {
  //   // Load from database or JWT claims
  //   return {
  //     entityType,
  //     canCreate: true,
  //     canRead: true,
  //     canUpdate: true,
  //     canDelete: true,
  //   };
  // }

  // private hasPermission(permissions: EntityPermissions, operation: string): boolean {
  //   switch (operation) {
  //     case 'create': return permissions.canCreate;
  //     case 'read': return permissions.canRead;
  //     case 'update': return permissions.canUpdate;
  //     case 'delete': return permissions.canDelete;
  //     default: return false;
  //   }
  // }
}

