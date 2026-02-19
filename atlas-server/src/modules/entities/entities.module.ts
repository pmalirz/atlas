import { Module } from '@nestjs/common';
import { EntitiesController } from './entities.controller';
import { EntitiesService } from './entities.service';
import { EntityRelationsService } from './entity-relations.service';
import { EntityRepository } from '../../database/entity.repository';
import { SchemaValidatorService } from './validation/schema-validator.service';
import { EntityAccessGuard } from './guards/entity-access.guard';

@Module({
  controllers: [EntitiesController],
  providers: [
    EntitiesService,
    EntityRelationsService,
    EntityRepository,
    SchemaValidatorService,
    EntityAccessGuard,
  ],
  exports: [EntitiesService, SchemaValidatorService],
})
export class EntitiesModule { }

