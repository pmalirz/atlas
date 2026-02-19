import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JWT Authentication Guard
 * 
 * Protects routes by validating JWT tokens.
 * Routes marked with @Public() decorator bypass authentication.
 */
@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        // Check if route is marked as public
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        return super.canActivate(context);
    }

    handleRequest<TUser = unknown>(err: Error | null, user: TUser | false): TUser {
        if (err || !user) {
            throw err || new UnauthorizedException('Authentication required');
        }
        return user;
    }
}
