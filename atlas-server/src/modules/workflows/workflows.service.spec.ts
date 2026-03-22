import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { PrismaService } from '../../database';
import { RbacService } from '../rbac/rbac.service';


describe('WorkflowsService', () => {
  let service: WorkflowsService;
  let prisma: PrismaService;
  let rbacService: { getUserRoles: jest.Mock };

  beforeEach(async () => {
    // We can also use a simple mock if mockPrismaService does not exist in this path
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowsService,
        {
          provide: PrismaService,
          useValue: {
            workflowDefinition: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: RbacService,
          useValue: {
            getUserRoles: jest.fn().mockResolvedValue({ roles: [] }),
          },
        },
      ],
    }).compile();

    service = module.get<WorkflowsService>(WorkflowsService);
    prisma = module.get<PrismaService>(PrismaService);
    rbacService = module.get<{ getUserRoles: jest.Mock }>(RbacService);
    
    // Suppress expected error logs from cluttering the test output
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluateTransition', () => {
    const defaultAuthCtx = { userId: '123', roles: ['App Editor'] };
    const defaultEntity = { attributes: { status: 'draft' } };

    const basicWorkflow = {
      id: 'wf-1',
      field: 'status',
      config: {
        transitions: [
          {
            name: 'submit',
            from: ['draft'],
            to: 'pending',
            condition: '$auth.roles.includes("App Editor")',
          },
          {
            name: 'approve',
            from: ['pending'],
            to: 'approved',
            condition: '$auth.roles.includes("Admin")',
          },
          {
            name: 'unrestricted',
            from: ['draft'],
            to: 'archived',
            // no condition = always allowed
          }
        ],
      },
    };

    it('should allow transition if condition evaluates to true', async () => {
      const isAllowed = await service.evaluateTransition(
        defaultEntity,
        basicWorkflow,
        defaultAuthCtx,
        'pending'
      );
      expect(isAllowed).toBe(true);
    });

    it('should deny transition if condition evaluates to false', async () => {
      const isAllowed = await service.evaluateTransition(
        defaultEntity,
        basicWorkflow,
        defaultAuthCtx, // does not have Admin role
        'approved'
      );
      expect(isAllowed).toBe(false); // denied because of strict role check
    });

    it('should hydrate roles from RBAC when auth context uses sub and empty roles', async () => {
      const workflow = {
        id: 'wf-admin-only',
        field: 'status',
        config: {
          transitions: [
            {
              name: 'archive',
              from: ['available'],
              to: 'archived',
              condition: '$auth.roles.includes("Admin")',
            },
          ],
        },
      };

      const entity = { attributes: { status: 'available' } };
      rbacService.getUserRoles.mockResolvedValueOnce({
        roles: [{ name: 'Admin' }],
      });

      const isAllowed = await service.evaluateTransition(
        entity,
        workflow,
        { sub: 'user-sub-id', tenantId: 'tenant-id', roles: [] },
        'archived',
      );

      expect(isAllowed).toBe(true);
      expect(rbacService.getUserRoles).toHaveBeenCalledWith('user-sub-id', 'tenant-id');
    });

    it('should allow transition if no condition is provided', async () => {
      const isAllowed = await service.evaluateTransition(
        defaultEntity,
        basicWorkflow,
        defaultAuthCtx,
        'archived'
      );
      expect(isAllowed).toBe(true);
    });

    it('should deny transition if from state does not match', async () => {
      // Trying to go to 'pending' from 'approved' (which is not allowed)
      const approvedEntity = { attributes: { status: 'approved' } };
      const isAllowed = await service.evaluateTransition(
        approvedEntity,
        basicWorkflow,
        defaultAuthCtx,
        'pending'
      );
      expect(isAllowed).toBe(false);
    });

    it('should handle complex expressions safely', async () => {
      const complexWorkflow = {
        field: 'status',
        config: {
          transitions: [
            {
              from: ['draft'],
              to: 'published',
              condition: '$entity.attributes.status === "draft" && $auth.userId === $entity.attributes.ownerId && $auth.roles.includes("Publisher")'
            }
          ]
        }
      };

      const entity = { attributes: { status: 'draft', ownerId: 'user-1' } };
      
      // Attempt 1: matching user and role
      expect(await service.evaluateTransition(
        entity,
        complexWorkflow,
        { userId: 'user-1', roles: ['Publisher'] },
        'published'
      )).toBe(true);

      // Attempt 2: wrong user
      expect(await service.evaluateTransition(
        entity,
        complexWorkflow,
        { userId: 'user-99', roles: ['Publisher'] },
        'published'
      )).toBe(false);

      // Attempt 3: wrong role
      expect(await service.evaluateTransition(
        entity,
        complexWorkflow,
        { userId: 'user-1', roles: ['Viewer'] },
        'published'
      )).toBe(false);
    });

    it('should deny and gracefully handle invalid JS expression errors', async () => {
      const badWorkflow = {
        id: 'wf-bad',
        field: 'status',
        config: {
          transitions: [
            {
              name: 'Try Fail',
              from: ['draft'],
              to: 'fail',
              condition: 'nonexistent_function()', // ReferenceError
            }
          ]
        }
      };

      const isAllowed = await service.evaluateTransition(
        defaultEntity,
        badWorkflow,
        defaultAuthCtx,
        'fail'
      );
      expect(isAllowed).toBe(false); // falls back to false on error
    });

    it('should deny transition when condition execution times out', async () => {
      const timeoutWorkflow = {
        id: 'wf-timeout',
        field: 'status',
        config: {
          transitions: [
            {
              name: 'Timeout',
              from: ['draft'],
              to: 'blocked',
              condition: 'while (true) {}',
            },
          ],
        },
      };

      const isAllowed = await service.evaluateTransition(
        defaultEntity,
        timeoutWorkflow,
        defaultAuthCtx,
        'blocked',
      );

      expect(isAllowed).toBe(false);
    });
  });
});
