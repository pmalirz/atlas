import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RoleWithPermissions, UserWithRoles } from '@app-atlas/shared/zod';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch all roles with their permissions for a specific tenant
   */
  async getRoles(tenantId: string): Promise<RoleWithPermissions[]> {
    const roles = await this.prisma.role.findMany({
      where: { tenantId },
      include: {
        permissions: true,
      },
    });

    // We cast to any here to satisfy TS, though the raw Prisma return aligns with RoleWithPermissions
    return roles as unknown as RoleWithPermissions[];
  }

  /**
   * Get a specific user's roles and permissions
   */
  async getUserRoles(userId: string, tenantId: string): Promise<UserWithRoles> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, tenantId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found in tenant.`);
    }

    const roles = user.userRoles.map((ur) => ur.role);

    return {
      id: user.id,
      email: user.email,
      roles: roles as unknown as RoleWithPermissions[],
    };
  }

  /**
   * Check if a user has a specific permission
   */
  async hasPermission(
    userId: string,
    tenantId: string,
    resourceType: string,
    resourceName: string,
    action: 'create' | 'read' | 'update' | 'delete',
  ): Promise<boolean> {
    const userWithRoles = await this.getUserRoles(userId, tenantId);
    
    // Iterate through user's roles
    for (const role of userWithRoles.roles) {
      for (const perm of role.permissions) {
        if (perm.resourceType !== resourceType) {
          continue;
        }
        if (perm.resourceName !== resourceName && perm.resourceName !== '*') {
          continue;
        }

        // Map the action to the corresponding permission flag
        let hasAccess = false;
        switch (action) {
          case 'create':
            hasAccess = perm.canCreate;
            break;
          case 'read':
            hasAccess = perm.canRead;
            break;
          case 'update':
            hasAccess = perm.canUpdate;
            break;
          case 'delete':
            hasAccess = perm.canDelete;
            break;
        }

        if (hasAccess) return true;
      }
    }

    return false;
  }
}
