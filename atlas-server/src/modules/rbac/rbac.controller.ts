import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller(':slug/rbac')
@UseGuards(AuthGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('roles')
  async getRoles(@Request() req: { user: { tenantId: string } }) {
    const tenantId = req.user.tenantId;
    return this.rbacService.getRoles(tenantId);
  }

  @Get('users/:id/roles')
  async getUserRoles(@Param('id') id: string, @Request() req: { user: { tenantId: string } }) {
    const tenantId = req.user.tenantId;
    return this.rbacService.getUserRoles(id, tenantId);
  }

  @Get('me')
  async getMyRoles(@Request() req: { user: { sub?: string; id?: string; tenantId: string } }) {
    const userId = req.user.sub || req.user.id;
    const tenantId = req.user.tenantId;
    // We expect userId to be defined, but TypeScript requires a string
    return this.rbacService.getUserRoles(userId as string, tenantId);
  }
}
