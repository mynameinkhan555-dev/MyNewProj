import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssignRoleUseCase } from './AssignRoleUseCase.js';
import { RoleAssignment, RoleAssignmentStatus } from '../../domain/index.js';
import { RoleAssignmentId } from '../../domain/index.js';
import { Membership, MembershipStatus } from '@workspace/tenant/domain';
import { TenantRole, TenantRoleStatus } from '../../domain/index.js';
import type { IMembershipRepository } from '@workspace/tenant/domain';
import type { ITenantRoleRepository } from '../../domain/index.js';
import type { IRoleAssignmentRepository } from '../../domain/index.js';
import type { IEventBus } from '../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import { ValidationApplicationError, NotFoundApplicationError } from '../errors/ApplicationError.js';

describe('AssignRoleUseCase', () => {
  let useCase: AssignRoleUseCase;
  let membershipRepository: IMembershipRepository;
  let tenantRoleRepository: ITenantRoleRepository;
  let roleAssignmentRepository: IRoleAssignmentRepository;
  let eventBus: IEventBus;
  let unitOfWork: IUnitOfWork;

  beforeEach(() => {
    // Mock repositories
    membershipRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByUserIdAndTenantId: vi.fn(),
    } as unknown as IMembershipRepository;

    tenantRoleRepository = {
      findById: vi.fn(),
      findByTenant: vi.fn(),
    } as unknown as ITenantRoleRepository;

    roleAssignmentRepository = {
      insert: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findByMembershipId: vi.fn(),
      findByMembershipAndRole: vi.fn(),
    } as unknown as IRoleAssignmentRepository;

    // Mock event bus
    eventBus = {
      publish: vi.fn(),
      publishAll: vi.fn(),
    };

    // Mock unit of work
    unitOfWork = {
      execute: vi.fn().mockImplementation(async (callback) => {
        await callback();
      }),
    } as unknown as IUnitOfWork;

    useCase = new AssignRoleUseCase(
      membershipRepository,
      tenantRoleRepository,
      roleAssignmentRepository,
      eventBus,
      unitOfWork
    );
  });

  it('should assign role successfully', async () => {
    // Arrange
    const membership = Membership.reconstruct({
      id: 'membership-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const tenantRole = TenantRole.reconstruct({
      id: 'role-1',
      tenantId: 'tenant-1',
      key: 'admin',
      displayName: 'Admin',
      description: 'Admin role',
      status: TenantRoleStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(membershipRepository.findById).mockResolvedValue(membership);
    vi.mocked(tenantRoleRepository.findById).mockResolvedValue(tenantRole);

    // Act
    const result = await useCase.execute({
      membershipId: 'membership-1',
      roleId: 'role-1',
      grantedBy: 'user-1',
    });

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.roleAssignmentId).toBeDefined();
    }
    expect(roleAssignmentRepository.insert).toHaveBeenCalled();
  });

  it('should return error when membership is not found', async () => {
    // Arrange
    vi.mocked(membershipRepository.findById).mockResolvedValue(null);

    // Act
    const result = await useCase.execute({
      membershipId: 'notfound',
      roleId: 'role-1',
      grantedBy: 'user-1',
    });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(NotFoundApplicationError);
    }
  });
});
