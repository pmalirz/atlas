import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthUser } from '@app-atlas/shared';
import type { IAuthProvider } from './auth-provider.interface';

/**
 * Clerk Authentication Provider
 * 
 * Integrates with Clerk.com for authentication.
 * Validates JWT tokens issued by Clerk.
 * 
 * Required environment variables:
 * - CLERK_SECRET_KEY: Backend API secret key
 * - CLERK_PUBLISHABLE_KEY: Frontend publishable key
 */
@Injectable()
export class ClerkProvider implements IAuthProvider {
    private readonly secretKey: string;
    private readonly publishableKey: string;

    constructor(private readonly configService: ConfigService) {
        this.secretKey = this.configService.get<string>('CLERK_SECRET_KEY', '');
        this.publishableKey = this.configService.get<string>('CLERK_PUBLISHABLE_KEY', '');
    }

    /**
     * Validate a Clerk session token
     * 
     * In production, use @clerk/clerk-sdk-node:
     * ```
     * import { verifyToken } from '@clerk/clerk-sdk-node';
     * const sessionClaims = await verifyToken(token, { secretKey: this.secretKey });
     * ```
     */
    async validateToken(token: string): Promise<AuthUser | null> {
        if (!this.secretKey) {
            console.warn('CLERK_SECRET_KEY not configured');
            return null;
        }

        try {
            // TODO: Implement actual Clerk token validation
            // This is a placeholder - install @clerk/clerk-sdk-node and implement
            // 
            // import { verifyToken, users } from '@clerk/clerk-sdk-node';
            // 
            // const sessionClaims = await verifyToken(token, { 
            //   secretKey: this.secretKey 
            // });
            // 
            // const clerkUser = await users.getUser(sessionClaims.sub);
            // 
            // return {
            //   id: clerkUser.id,
            //   externalId: clerkUser.id,
            //   provider: 'clerk',
            //   email: clerkUser.emailAddresses[0]?.emailAddress,
            //   emailVerified: clerkUser.emailAddresses[0]?.verification?.status === 'verified',
            //   name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim(),
            //   avatarUrl: clerkUser.imageUrl,
            //   tenantId: sessionClaims.org_id || DEFAULT_TENANT_ID,
            // };

            console.warn('Clerk provider not fully implemented - install @clerk/clerk-sdk-node');
            return null;
        } catch (error) {
            console.error('Clerk token validation failed:', error);
            return null;
        }
    }

    /**
     * Get client configuration for frontend
     */
    getClientConfig(): Record<string, unknown> {
        return {
            clerkPublishableKey: this.publishableKey,
        };
    }
}
