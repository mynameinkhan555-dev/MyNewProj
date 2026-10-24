import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CheckPermissionUseCase } from './CheckPermissionUseCase.js';
import { User, UserStatus } from '@workspace/identity/domain';
import { Tenant, TenantStatus } from '@workspace/tenant/domain';
import { Membership, MembershipStatus } from '@workspace/tenant/domain';
import type { IMembershipRepository } from '@workspace/tenant/domain';
import type { ITenantRepository } from '@workspace/tenant/domain';
import type { IUserRepository } from '@workspace/identity/domain';
import type { IRoleAssignmentRepository } from '../../domain/index.js';
import type { IRolePermissionRepository } from '../../domain/index.js';
import type { IPermissionRepository } from '../../domain/index.js';
import { ValidationApplicationError, NotFoundApplicationError } from '../errors/ApplicationError.js';

describe('CheckPermissionUseCase', () => {
  let useCase: CheckPermissionUseCase;
  let membershipRepository: IMembershipRepository;
  let tenantRepository: ITenantRepository;
  let userRepository: IUserRepository;
  let roleAssignmentRepository: IRoleAssignmentRepository;
  let rolePermissionRepository: IRolePermissionRepository;
  let permissionRepository: IPermissionRepository;

  beforeEach(() => {
    // Mock repositories
    membershipRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByUserIdAndTenantId: vi.fn(),
    } as unknown as IMembershipRepository;

    tenantRepository = {
      findById: vi.fn(),
    } as unknown as ITenantRepository;

    userRepository = {
      findById: vi.fn(),
    } as unknown as IUserRepository;

    roleAssignmentRepository = {
      findById: vi.fn(),
      findByMembershipId: vi.fn(),
      findByMembershipIds: vi.fn(),
    } as unknown as IRoleAssignmentRepository;

    rolePermissionRepository = {
      findByRoleId: vi.fn(),
      findByRoleIds: vi.fn(),
    } as unknown as IRolePermissionRepository;

    permissionRepository = {
      findById: vi.fn(),
      findByIds: vi.fn(),
    } as unknown as IPermissionRepository;

    useCase = new CheckPermissionUseCase(
      membershipRepository,
      tenantRepository,
      userRepository,
      roleAssignmentRepository,
      rolePermissionRepository,
      permissionRepository
    );
  });

  it('should return ALLOW when user has permission', async () => {
    // Arrange
    const user = User.reconstruct({
      id: 'user-1',
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const tenant = Tenant.reconstruct({
      id: 'tenant-1',
      name: 'Test Tenant',
      status: TenantStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const membership = Membership.reconstruct({
      id: 'membership-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(userRepository.findById).mockResolvedValue(user);
    vi.mocked(tenantRepository.findById).mockResolvedValue(tenant);
    vi.mocked(membershipRepository.findByUserIdAndTenantId).mockResolvedValue([membership]);
    vi.mocked(roleAssignmentRepository.findByMembershipIds).mockResolvedValue([]);
    vi.mocked(rolePermissionRepository.findByRoleIds).mockResolvedValue([]);

    // Act
    const result = await useCase.execute({
      userId: 'user-1',
      tenantId: 'tenant-1',
      action: 'user.read',
      resource: 'user',
    });

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.allowed).toBe(false); // No roles = no permission
    }
  });

  it('should return DENY when user is not found', async () => {
    // Arrange
    vi.mocked(userRepository.findById).mockResolvedValue(null);

    // Act
    const result = await useCase.execute({
      userId: 'notfound',
      tenantId: 'tenant-1',
      action: 'user.read',
      resource: 'user',
    });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(NotFoundApplicationError);
    }
  });

  it('should return validation error when input is missing', async () => {
    // Act
    const result = await useCase.execute({
      userId: '',
      tenantId: '',
      action: '',
      resource: '',
    });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationApplicationError);
    }
  });
});
