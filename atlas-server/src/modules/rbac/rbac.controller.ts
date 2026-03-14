import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('rbac')
@UseGuards(AuthGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('roles')
  async getRoles(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.rbacService.getRoles(tenantId);
  }

  @Get('users/:id/roles')
  async getUserRoles(@Param('id') id: string, @Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.rbacService.getUserRoles(id, tenantId);
  }

  @Get('me')
  async getMyRoles(@Request() req: any) {
    const userId = req.user.sub || req.user.id;
    const tenantId = req.user.tenantId;
    return this.rbacService.getUserRoles(userId, tenantId);
  }
}
