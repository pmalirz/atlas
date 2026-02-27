import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClsService } from 'nestjs-cls';
import { TenantService } from '../../modules/tenant';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../modules/auth/decorators/public.decorator';

/** CLS keys for tenant context */
export const CLS_TENANT_ID = 'tenantId';
export const CLS_TENANT_SLUG = 'tenantSlug';

/**
 * Global interceptor that resolves the tenant from the `:slug` route parameter,
 * stores tenantId/slug in CLS, and makes them available to all downstream services.
 *
 * Routes that do NOT have a `:slug` param (e.g., health-check at `/`) are skipped.
 */
@Injectable()
export class TenantScopeInterceptor implements NestInterceptor {
    private readonly logger = new Logger(TenantScopeInterceptor.name);

    constructor(
        private readonly tenantService: TenantService,
        private readonly cls: ClsService,
        private readonly reflector: Reflector,
    ) { }

    async intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<unknown>> {
        const request = context.switchToHttp().getRequest();
        const slug: string | undefined = request.params?.slug;

        // If no slug param is present, let the request through
        // (e.g., root health-check or non-tenant routes)
        if (!slug) {
            return next.handle();
        }

        // Resolve tenant from slug (throws 404 if not found / inactive)
        const tenant = await this.tenantService.resolveBySlug(slug);

        // Store in CLS for transparent access in services
        this.cls.set(CLS_TENANT_ID, tenant.id);
        this.cls.set(CLS_TENANT_SLUG, tenant.slug);

        return next.handle();
    }
}
