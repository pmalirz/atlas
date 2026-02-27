import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface TenantRecord {
    id: string;
    name: string;
    displayName: string;
    slug: string;
    isActive: boolean;
}

@Injectable()
export class TenantService {
    private readonly logger = new Logger(TenantService.name);

    /** In-memory slug → tenant cache (cleared on restart). */
    private readonly slugCache = new Map<string, TenantRecord>();

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Resolve a slug to a tenant, with caching.
     * Throws 404 if slug is unknown or tenant is inactive.
     */
    async resolveBySlug(slug: string): Promise<TenantRecord> {
        // Check cache first
        const cached = this.slugCache.get(slug);
        if (cached) {
            return cached;
        }

        const tenant = await this.prisma.tenant.findUnique({
            where: { slug },
        });

        if (!tenant) {
            throw new NotFoundException(`Tenant with slug "${slug}" not found`);
        }

        if (!tenant.isActive) {
            throw new NotFoundException(`Tenant "${slug}" is not active`);
        }

        const record: TenantRecord = {
            id: tenant.id,
            name: tenant.name,
            displayName: tenant.displayName,
            slug: tenant.slug,
            isActive: tenant.isActive,
        };

        this.slugCache.set(slug, record);
        return record;
    }

    /**
     * Get tenant by ID (no cache — used rarely).
     */
    async findById(id: string): Promise<TenantRecord | null> {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
        });

        if (!tenant) {
            return null;
        }

        return {
            id: tenant.id,
            name: tenant.name,
            displayName: tenant.displayName,
            slug: tenant.slug,
            isActive: tenant.isActive,
        };
    }

    /**
     * Invalidate the slug cache for a specific slug (e.g., after rename).
     */
    invalidateCache(slug: string): void {
        this.slugCache.delete(slug);
    }

    /**
     * Clear the entire slug cache.
     */
    clearCache(): void {
        this.slugCache.clear();
    }
}
