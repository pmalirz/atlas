// =============================================================================
// Tenant Schemas
// =============================================================================
// Tenant (workspace) related types, DTOs, and validation schemas.
// =============================================================================

import { z } from 'zod';

// -----------------------------------------------------------------------------
// Tenant Slug Validation
// -----------------------------------------------------------------------------

/**
 * Reserved tenant slugs that cannot be used
 */
export const RESERVED_TENANT_SLUGS = [
    'platform',
    'admin',
    'api',
    'auth',
    'login',
    'register',
    'health',
    'docs',
    'swagger',
    'graphql',
] as const;

/**
 * Tenant slug validation schema
 * - 3-50 characters
 * - lowercase alphanumeric with hyphens
 * - cannot start or end with hyphen
 * - cannot contain consecutive hyphens
 * - cannot be a reserved slug
 */
export const TenantSlugSchema = z
    .string()
    .min(3, 'Tenant slug must be at least 3 characters')
    .max(50, 'Tenant slug cannot exceed 50 characters')
    .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Tenant slug must be lowercase alphanumeric with hyphens, cannot start/end with hyphen or have consecutive hyphens',
    )
    .refine(
        (slug) => !RESERVED_TENANT_SLUGS.includes(slug as (typeof RESERVED_TENANT_SLUGS)[number]),
        'This tenant slug is reserved and cannot be used',
    );

// -----------------------------------------------------------------------------
// Tenant Types
// -----------------------------------------------------------------------------

/**
 * Tenant data schema (for API responses)
 */
export const TenantSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(255),
    displayName: z.string().min(1).max(255),
    description: z.string().default(''),
    slug: TenantSlugSchema,
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
export type Tenant = z.infer<typeof TenantSchema>;

/**
 * Tenant summary (for lists, dropdowns)
 */
export const TenantSummarySchema = z.object({
    id: z.string().uuid(),
    slug: z.string(),
    name: z.string(),
    displayName: z.string(),
    isActive: z.boolean(),
});
export type TenantSummary = z.infer<typeof TenantSummarySchema>;

// -----------------------------------------------------------------------------
// Tenant Management DTOs
// -----------------------------------------------------------------------------

/**
 * Create tenant request
 */
export const CreateTenantRequestSchema = z.object({
    name: z.string()
        .min(1, 'Tenant name is required')
        .max(255)
        .regex(/^\S+$/, 'Tenant name must not contain whitespace'),
    displayName: z.string().min(1, 'Display name is required').max(255),
    description: z.string().max(1000).optional(),
    slug: TenantSlugSchema.optional(), // Defaults to name if not provided
});
export type CreateTenantRequest = z.infer<typeof CreateTenantRequestSchema>;

/**
 * Update tenant request
 */
export const UpdateTenantRequestSchema = z.object({
    displayName: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional(),
    isActive: z.boolean().optional(),
});
export type UpdateTenantRequest = z.infer<typeof UpdateTenantRequestSchema>;

/**
 * Tenant list response
 */
export const TenantListResponseSchema = z.object({
    tenants: z.array(TenantSummarySchema),
    total: z.number(),
});
export type TenantListResponse = z.infer<typeof TenantListResponseSchema>;
