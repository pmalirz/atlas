import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RbacService } from '../../rbac/rbac.service';

/**
 * Intercepts requests and responses to filter element attributes based on the user's RBAC attribute-level permissions.
 *
 * - On Request (POST/PATCH/PUT): Strips incoming JSON payload of fields the user is not allowed to modify. If required fields are stripped, validation will fail downstream.
 * - On Response (GET): Filters out fields the user is not allowed to read.
 */
@Injectable()
export class AttributeAccessInterceptor implements NestInterceptor {
  constructor(private readonly rbacService: RbacService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    const entityType = request.params?.entityType;
    const user = request.user;
    const method = request.method;

    if (!entityType || !user) {
      return next.handle();
    }

    const userId = user.id || user.sub;
    const tenantId = user.tenantId;

    // Fetch user's roles
    const userWithRoles = await this.rbacService.getUserRoles(userId, tenantId);

    // Aggregate readable/updatable sets for this entityType based on roles
    let hasExplicitReadableList = false;
    const readableAttributes = new Set<string>();
    let hasExplicitUpdatableList = false;
    const updatableAttributes = new Set<string>();

    for (const role of userWithRoles.roles) {
      const perm = role.permissions.find(
        (p) =>
          p.resourceType === 'entity' &&
          (p.resourceName === entityType || p.resourceName === '*'),
      );

      if (perm) {
        // Evaluate readable attributes
        if (perm.readableAttributes && Array.isArray(perm.readableAttributes)) {
          hasExplicitReadableList = true;
          perm.readableAttributes.forEach((attr: string) => readableAttributes.add(attr));
        }

        // Evaluate updatable attributes
        if (perm.updatableAttributes && Array.isArray(perm.updatableAttributes)) {
          hasExplicitUpdatableList = true;
          perm.updatableAttributes.forEach((attr: string) => updatableAttributes.add(attr));
        }
      }
    }

    // Function to filter an attributes object
    const filterAttributes = (attributes: Record<string, unknown>) => {
      if (!attributes || typeof attributes !== 'object') return attributes;

      const filtered = { ...attributes };
      for (const key of Object.keys(filtered)) {
        if (hasExplicitReadableList && !readableAttributes.has(key)) {
          delete filtered[key];
        }
      }
      return filtered;
    };

    // 1. Intercept Request Payload (Write operations)
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && request.body?.attributes) {
        const bodyAttributes = request.body.attributes;
        const keysAttemptedToModify = Object.keys(bodyAttributes);
        const keysUnauthorized = keysAttemptedToModify.filter(
            (key) => hasExplicitUpdatableList && !updatableAttributes.has(key)
        );

        if (keysUnauthorized.length > 0) {
            throw new ForbiddenException(`You do not have permission to modify attributes: ${keysUnauthorized.join(', ')}`);
        }
    }

    // 2. Intercept Response Payload (Read operations)
    return next.handle().pipe(
      map((data: Record<string, unknown>) => {
        // data could be a single EntityResponse or a PaginatedResponse
        if (!data) return data;

        if (data.data && Array.isArray(data.data)) {
          // Paginated list
          data.data = data.data.map((entity: Record<string, unknown>) => {
            if (entity.attributes) {
              entity.attributes = filterAttributes(entity.attributes as Record<string, unknown>);
            }
            return entity;
          });
        } else if (data.attributes) {
          // Single entity
          data.attributes = filterAttributes(data.attributes as Record<string, unknown>);
        }

        return data;
      }),
    );
  }
}
