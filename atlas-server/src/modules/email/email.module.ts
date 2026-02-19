import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { EMAIL_PROVIDER, NodemailerProvider } from './providers';

/**
 * Email Module
 * 
 * Global module for email sending functionality.
 * Uses Nodemailer by default, but the provider can be swapped.
 */
@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: EMAIL_PROVIDER,
            useClass: NodemailerProvider,
        },
        EmailService,
    ],
    exports: [EmailService],
})
export class EmailModule { }
