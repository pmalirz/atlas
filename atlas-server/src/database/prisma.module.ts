import { Global, Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClsService, ClsModule } from 'nestjs-cls';
import { PrismaService } from './prisma.service';
import { EntityRepository } from './entity.repository';
import { RelationRepository } from './relation.repository';

@Global()
@Module({
  imports: [ClsModule],
  providers: [
    {
      provide: PrismaService,
      useFactory: async (cls: ClsService) => {
        const client = new PrismaClient({
          log: [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'info' },
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ],
        });

        await client.$connect();

        return client.$extends({
          query: {
            $allModels: {
              async $allOperations({ model, operation, args, query }) {
                const userId = cls.get('userId');
                const requestId = cls.get('requestId');

                // Only wrap mutations in transaction to set context
                const isMutation = [
                  'create', 'update', 'delete', 'upsert',
                  'createMany', 'updateMany', 'deleteMany'
                ].includes(operation);

                if (!isMutation || !userId || userId === 'anonymous') {
                  return query(args);
                }

                // Wrap in interactive transaction to ensure set_config applies to the query
                // Handle nested transactions by catching the error and falling back to direct execution
                try {
                  return await client.$transaction(async (tx) => {
                    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
                    if (requestId) {
                      await tx.$executeRaw`SELECT set_config('app.request_id', ${requestId}, true)`;
                    }

                    // Execute operation ON THE TRANSACTION CLIENT
                    // Dynamic execution requires 'any' cast because tx is strictly typed
                    // Model name in extension is usually Capitalized (e.g. 'Entity'), but client prop is camelCase (e.g. 'entity')
                    if (model) {
                      const modelName = model.charAt(0).toLowerCase() + model.slice(1);
                      return await (tx as any)[modelName][operation](args);
                    } else {
                      return await (tx as any)[operation](args);
                    }
                  });
                } catch (error: any) {
                  // If we are already in a transaction, Prisma throws an error about nested transactions.
                  // In that case, the outer transaction should have already set the context.
                  // Just execute the query directly without trying to set context again
                  // (using client.$executeRaw here would go to a different connection anyway).
                  if (error.message?.includes('Nested transactions') || error.code === 'P2034') {
                    return query(args);
                  }

                  throw error;
                }
              },
            },
          },
        }) as unknown as PrismaService;
      },
      inject: [ClsService],
    },
    EntityRepository,
    RelationRepository,
  ],
  exports: [PrismaService, EntityRepository, RelationRepository],
})
export class PrismaModule { }
