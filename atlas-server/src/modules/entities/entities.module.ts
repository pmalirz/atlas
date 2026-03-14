import { Module } from '@nestjs/common';
import { EntitiesController } from './entities.controller';
import { EntitiesService } from './entities.service';
import { EntityRelationsService } from './entity-relations.service';
import { EntityRepository } from '../../database/entity.repository';
import { SchemaValidatorService } from './validation/schema-validator.service';
import { EntityAccessGuard } from './guards/entity-access.guard';

// Import RbacModule to provide RbacService for the guard
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [RbacModule],
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
