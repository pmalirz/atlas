import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import type { AuthTokenPayload, AuthUser } from '@app-atlas/shared';
import { PrismaService } from '../../../database';
import { AUTH_COOKIE_NAME } from '../constants';

/**
 * Extract JWT from cookie or Authorization header
 * Cookie takes precedence for browser clients (more secure)
 * Authorization header is fallback for API clients/Swagger
 */
const extractJwtFromCookieOrHeader = (req: Request): string | null => {
    // First, try to get from HttpOnly cookie
    const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
    if (cookieToken) {
        return cookieToken;
    }

    // Fallback to Authorization header (for Swagger, mobile apps, etc.)
    return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
};

/**
 * JWT Strategy for Passport authentication
 * 
 * Validates JWT tokens from HttpOnly cookie or Authorization header and attaches user to request.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: extractJwtFromCookieOrHeader,
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET', 'default-dev-secret'),
        });
    }

    /**
     * Validate JWT payload and return user object
     * Called automatically by Passport when a valid JWT is found
     */
    async validate(payload: AuthTokenPayload): Promise<AuthUser | null> {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user) {
            return null;
        }

        return {
            id: user.id,
            externalId: user.externalId,
            provider: payload.provider,
            email: user.email,
            emailVerified: user.emailVerified,
            name: user.name,
            avatarUrl: user.avatarUrl,
            tenantId: user.tenantId,
            createdAt: user.createdAt.toISOString(),
            lastLoginAt: user.lastLoginAt?.toISOString(),
        };
    }
}
