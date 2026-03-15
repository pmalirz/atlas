// =============================================================================
// RBAC (Role-Based Access Control) Schemas
// =============================================================================
// Zod schemas for validation and type inference for RBAC entities.
// =============================================================================

import { z } from 'zod';

// -----------------------------------------------------------------------------
// Role Schema
// -----------------------------------------------------------------------------

export const RoleSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(255),
    description: z.string().default(''),
    tenantId: z.string().uuid(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    updatedBy: z.string().nullable().optional(),
});
export type Role = z.infer<typeof RoleSchema>;

// -----------------------------------------------------------------------------
// RolePermission Schema
// -----------------------------------------------------------------------------

export const RolePermissionSchema = z.object({
    id: z.string().uuid(),
    roleId: z.string().uuid(),
    resourceType: z.string().min(1).max(50),
    resourceName: z.string().min(1).max(255),
    canCreate: z.boolean(),
    canRead: z.boolean(),
    canUpdate: z.boolean(),
    canDelete: z.boolean(),
    readableAttributes: z.array(z.string()).nullable().optional(),
    updatableAttributes: z.array(z.string()).nullable().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    updatedBy: z.string().nullable().optional(),
});
export type RolePermission = z.infer<typeof RolePermissionSchema>;

// -----------------------------------------------------------------------------
// UserRole Schema
// -----------------------------------------------------------------------------

export const UserRoleSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    roleId: z.string().uuid(),
    tenantId: z.string().uuid(),
    createdAt: z.string().datetime(),
    createdBy: z.string().nullable().optional(),
});
export type UserRole = z.infer<typeof UserRoleSchema>;

// -----------------------------------------------------------------------------
// Composite Types (Aggregates)
// -----------------------------------------------------------------------------

/**
 * A Role with its associated permissions
 */
export const RoleWithPermissionsSchema = RoleSchema.extend({
    permissions: z.array(RolePermissionSchema),
});
export type RoleWithPermissions = z.infer<typeof RoleWithPermissionsSchema>;

/**
 * A User with their assigned roles and permissions
 */
export const UserWithRolesSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    roles: z.array(RoleWithPermissionsSchema),
});
export type UserWithRoles = z.infer<typeof UserWithRolesSchema>;

// -----------------------------------------------------------------------------
// DTOs (Data Transfer Objects)
// -----------------------------------------------------------------------------

export const CreateRolePermissionRequestSchema = RolePermissionSchema.pick({
    resourceType: true,
    resourceName: true,
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
    readableAttributes: true,
    updatableAttributes: true,
}).extend({
    // allowing optional booleans for creating with defaults
    canCreate: z.boolean().optional().default(false),
    canRead: z.boolean().optional().default(false),
    canUpdate: z.boolean().optional().default(false),
    canDelete: z.boolean().optional().default(false),
});
export type CreateRolePermissionRequest = z.infer<typeof CreateRolePermissionRequestSchema>;

export const UpdateRolePermissionRequestSchema = CreateRolePermissionRequestSchema.partial();
export type UpdateRolePermissionRequest = z.infer<typeof UpdateRolePermissionRequestSchema>;

export const CreateRoleRequestSchema = RoleSchema.pick({
    name: true,
    description: true,
}).extend({
    permissions: z.array(CreateRolePermissionRequestSchema).optional(),
});
export type CreateRoleRequest = z.infer<typeof CreateRoleRequestSchema>;

export const UpdateRoleRequestSchema = CreateRoleRequestSchema.partial();
export type UpdateRoleRequest = z.infer<typeof UpdateRoleRequestSchema>;

export const AssignUserRoleRequestSchema = z.object({
    userId: z.string().uuid(),
    roleId: z.string().uuid(),
});
export type AssignUserRoleRequest = z.infer<typeof AssignUserRoleRequestSchema>;
