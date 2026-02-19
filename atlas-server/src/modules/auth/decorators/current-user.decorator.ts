import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '@app-atlas/shared';

/**
 * Decorator to extract current user from request
 * 
 * Usage:
 * ```
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthUser) { ... }
 * ```
 */
export const CurrentUser = createParamDecorator(
    (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | unknown => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as AuthUser;

        if (data) {
            return user?.[data];
        }

        return user;
    },
);
