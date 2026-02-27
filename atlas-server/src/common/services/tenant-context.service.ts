import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { CLS_TENANT_ID, CLS_TENANT_SLUG } from '../interceptors/tenant-scope.interceptor';

/**
 * Service to access the current tenant context from CLS.
 * Inject this into any service that needs tenant-scoped queries.
 */
@Injectable()
export class TenantContextService {
    constructor(private readonly cls: ClsService) { }

    /**
     * Get the current tenant ID from CLS context.
     * Throws if no tenant is in context (indicates a bug — all tenant-scoped
     * routes should go through TenantScopeInterceptor).
     */
    getTenantId(): string {
        const tenantId = this.cls.get<string>(CLS_TENANT_ID);
        if (!tenantId) {
            throw new Error(
                'No tenant context available. Ensure the route includes :slug param ' +
                'and TenantScopeInterceptor is registered.',
            );
        }
        return tenantId;
    }

    /**
     * Get the current tenant slug from CLS context.
     */
    getTenantSlug(): string | undefined {
        return this.cls.get<string>(CLS_TENANT_SLUG);
    }

    /**
     * Check if a tenant context is available.
     */
    hasTenantContext(): boolean {
        return !!this.cls.get<string>(CLS_TENANT_ID);
    }
}
