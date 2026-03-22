import { Module, forwardRef } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { EntitiesModule } from '../entities/entities.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [forwardRef(() => EntitiesModule), RbacModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}

