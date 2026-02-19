import { Module } from '@nestjs/common';
import { RelationsController } from './relations.controller';
import { RelationsService } from './relations.service';
import { EntitiesModule } from '../entities/entities.module';

@Module({
  imports: [EntitiesModule],
  controllers: [RelationsController],
  providers: [RelationsService],
  exports: [RelationsService],
})
export class RelationsModule { }
