import { Module } from '@nestjs/common';
import { UIConfigController } from './ui-config.controller';
import { UIConfigService } from './ui-config.service';

@Module({
    controllers: [UIConfigController],
    providers: [UIConfigService],
    exports: [UIConfigService],
})
export class UIConfigModule { }
