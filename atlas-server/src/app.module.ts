import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database';
import { RelationsModule } from './modules/relations/relations.module';
import { DefinitionsModule } from './modules/definitions/definitions.module';
import { UIConfigModule } from './modules/ui-config/ui-config.module';
import { EntitiesModule } from './modules/entities/entities.module';
import { AuthModule, AuthGuard } from './modules/auth';
import { EmailModule } from './modules/email';
import { TenantModule } from './modules/tenant';
import { RbacModule } from './modules/rbac/rbac.module';
import { ClsModule } from 'nestjs-cls';
import { randomUUID } from 'crypto';
import { AuditContextInterceptor, TenantScopeInterceptor } from './common/interceptors';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req: any) => {
          // Setup Request ID immediately
          const requestId = req.headers['x-request-id'] ?? randomUUID();
          cls.set('requestId', requestId);
        }
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Rate limiting: configurable via env vars
    // Global: THROTTLE_TTL/THROTTLE_LIMIT (default: 100 req/min)
    // Auth endpoints: THROTTLE_AUTH_TTL/THROTTLE_AUTH_LIMIT (default: 10 req/min - stricter for auth)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          // Default throttler for all endpoints
          name: 'default',
          ttl: config.get<number>('THROTTLE_TTL', 60000),
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
        {
          // Stricter throttler for auth endpoints (login, register, password reset)
          name: 'auth',
          ttl: config.get<number>('THROTTLE_AUTH_TTL', 60000),
          limit: config.get<number>('THROTTLE_AUTH_LIMIT', 10),
        },
      ],
    }),
    PrismaModule,
    EmailModule,
    TenantModule,
    AuthModule.forRoot(),
    RelationsModule,
    DefinitionsModule,
    UIConfigModule,
    EntitiesModule,
    RbacModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply AuthGuard globally - routes use @Public() to opt-out
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    // Apply ThrottlerGuard globally for rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Resolve tenant from :slug route param and store in CLS
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantScopeInterceptor,
    },
    // Capture user context for audit log (CLS)
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditContextInterceptor,
    },
  ],
})
export class AppModule { }

