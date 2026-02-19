import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { AuthUser, LoginRequest, RegisterRequest, AuthResponse } from '@app-atlas/shared';
import type { IAuthProvider } from './auth-provider.interface';
import { PrismaService } from '../../../database';
import { DEFAULT_TENANT_ID } from '../constants';

const SALT_ROUNDS = 12;

/**
 * Atlas Native Authentication Provider
 * 
 * Implements local username/password authentication with:
 * - bcrypt password hashing
 * - JWT token generation
 * - User registration
 */
@Injectable()
export class AtlasNativeProvider implements IAuthProvider {
    constructor(
        private readonly configService: ConfigService,
        private readonly prisma?: PrismaService,
        private readonly jwtService?: JwtService,
    ) { }

    /**
     * Validate a JWT token and return the user
     */
    async validateToken(token: string): Promise<AuthUser | null> {
        if (!this.jwtService || !this.prisma) {
            throw new Error('AtlasNativeProvider not properly initialized');
        }

        try {
            const payload = this.jwtService.verify(token);

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });

            if (!user) {
                return null;
            }

            return {
                id: user.id,
                externalId: user.externalId,
                provider: 'native',
                email: user.email,
                emailVerified: user.emailVerified,
                name: user.name,
                avatarUrl: user.avatarUrl,
                tenantId: user.tenantId,
                createdAt: user.createdAt.toISOString(),
                lastLoginAt: user.lastLoginAt?.toISOString(),
            };
        } catch {
            return null;
        }
    }

    /**
     * Login with email and password
     */
    async login(credentials: LoginRequest): Promise<AuthResponse> {
        if (!this.jwtService || !this.prisma) {
            throw new Error('AtlasNativeProvider not properly initialized');
        }

        const user = await this.prisma.user.findUnique({
            where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        const authUser: AuthUser = {
            id: user.id,
            externalId: user.externalId,
            provider: 'native',
            email: user.email,
            emailVerified: user.emailVerified,
            name: user.name,
            avatarUrl: user.avatarUrl,
            tenantId: user.tenantId,
            createdAt: user.createdAt.toISOString(),
            lastLoginAt: new Date().toISOString(),
        };

        const { accessToken, expiresIn } = this.generateToken(authUser);

        return {
            accessToken,
            expiresIn,
            user: authUser,
        };
    }

    /**
     * Register a new user
     */
    async register(data: RegisterRequest): Promise<AuthResponse> {
        if (!this.jwtService || !this.prisma) {
            throw new Error('AtlasNativeProvider not properly initialized');
        }

        // Check if user already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new UnauthorizedException('User with this email already exists');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                name: data.name,
                provider: 'native',
                tenantId: DEFAULT_TENANT_ID,
                emailVerified: false,
                lastLoginAt: new Date(),
            },
        });

        const authUser: AuthUser = {
            id: user.id,
            externalId: null,
            provider: 'native',
            email: user.email,
            emailVerified: user.emailVerified,
            name: user.name,
            avatarUrl: user.avatarUrl,
            tenantId: user.tenantId,
            createdAt: user.createdAt.toISOString(),
            lastLoginAt: user.lastLoginAt?.toISOString(),
        };

        const { accessToken, expiresIn } = this.generateToken(authUser);

        return {
            accessToken,
            expiresIn,
            user: authUser,
        };
    }

    /**
     * Generate JWT token for user
     */
    private generateToken(user: AuthUser): { accessToken: string; expiresIn: number } {
        if (!this.jwtService) {
            throw new Error('JwtService not available');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId,
            provider: user.provider,
        };

        const accessToken = this.jwtService.sign(payload);
        const expiresIn = this.parseExpiresIn(
            this.configService.get<string>('JWT_EXPIRES_IN', '7d')
        );

        return { accessToken, expiresIn };
    }

    /**
     * Parse expires in string to seconds
     */
    private parseExpiresIn(expiresIn: string): number {
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match) return 86400;

        const value = parseInt(match[1], 10);
        const unit = match[2];

        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 3600;
            case 'd': return value * 86400;
            default: return 86400;
        }
    }
}
