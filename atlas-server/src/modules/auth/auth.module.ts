import { Module, DynamicModule, Global } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthGuard } from './guards/auth.guard';
import { AUTH_PROVIDER } from './constants';
import { AtlasNativeProvider } from './providers/atlas-native.provider';
import { ClerkProvider } from './providers/clerk.provider';
import { LogtoProvider } from './providers/logto.provider';
import { SsoProvider } from './providers/sso.provider';
import { PrismaModule, PrismaService } from '../../database';
import type { AuthProvider } from '@app-atlas/shared';

/**
 * AuthModule - Pluggable authentication module
 * 
 * Supports multiple auth providers:
 * - native: Local username/password with JWT
 * - clerk: Clerk.com auth-as-a-service
 * - logto: Open-source identity platform
 * - sso: OIDC/SAML for enterprise SSO (Azure EntraID, OKTA, etc.)
 * 
 * Configure via AUTH_PROVIDER environment variable.
 */
@Global()
@Module({})
export class AuthModule {
    static forRoot(): DynamicModule {
        return {
            module: AuthModule,
            imports: [
                PrismaModule,
                PassportModule.register({ defaultStrategy: 'jwt' }),
                JwtModule.registerAsync({
                    imports: [ConfigModule],
                    inject: [ConfigService],
                    useFactory: (configService: ConfigService) => ({
                        secret: configService.get<string>('JWT_SECRET', 'default-dev-secret'),
                        signOptions: {
                            expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d') as unknown as number,
                        },
                    }),
                }),
                ConfigModule,
            ],
            controllers: [AuthController],
            providers: [
                AuthService,
                JwtStrategy,
                AuthGuard,
                // Provider factory - creates the appropriate provider based on config
                {
                    provide: AUTH_PROVIDER,
                    useFactory: (
                        configService: ConfigService,
                        prisma: PrismaService,
                        jwtService: JwtService,
                    ) => {
                        const provider = configService.get<AuthProvider>('AUTH_PROVIDER', 'native');

                        switch (provider) {
                            case 'clerk':
                                return new ClerkProvider(configService);
                            case 'logto':
                                return new LogtoProvider(configService);
                            case 'sso':
                                return new SsoProvider(configService);
                            case 'native':
                            default:
                                return new AtlasNativeProvider(configService, prisma, jwtService);
                        }
                    },
                    inject: [ConfigService, PrismaService, JwtService],
                },
            ],
            exports: [AuthService, AuthGuard, JwtModule, AUTH_PROVIDER],
        };
    }
}

