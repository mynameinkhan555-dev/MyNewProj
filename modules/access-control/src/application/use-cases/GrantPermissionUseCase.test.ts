import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GrantPermissionUseCase } from './GrantPermissionUseCase.js';
import { TenantRole, TenantRoleStatus } from '../../domain/index.js';
import { Permission, PermissionStatus, PermissionScope } from '../../domain/index.js';
import type { ITenantRoleRepository } from '../../domain/index.js';
import type { IPermissionRepository } from '../../domain/index.js';
import type { IRolePermissionRepository } from '../../domain/index.js';
import type { IEventBus } from '../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import { ValidationApplicationError, NotFoundApplicationError } from '../errors/ApplicationError.js';

describe('GrantPermissionUseCase', () => {
  let useCase: GrantPermissionUseCase;
  let tenantRoleRepository: ITenantRoleRepository;
  let permissionRepository: IPermissionRepository;
  let rolePermissionRepository: IRolePermissionRepository;
  let eventBus: IEventBus;
  let unitOfWork: IUnitOfWork;

  beforeEach(() => {
    // Mock repositories
    tenantRoleRepository = {
      findById: vi.fn(),
      findByTenant: vi.fn(),
    } as unknown as ITenantRoleRepository;

    permissionRepository = {
      findById: vi.fn(),
      findByKey: vi.fn(),
    } as unknown as IPermissionRepository;

    rolePermissionRepository = {
      exists: vi.fn(),
      grant: vi.fn().mockResolvedValue(undefined),
      revoke: vi.fn(),
    } as unknown as IRolePermissionRepository;

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

    useCase = new GrantPermissionUseCase(
      tenantRoleRepository,
      permissionRepository,
      rolePermissionRepository,
      eventBus,
      unitOfWork
    );
  });

  it('should grant permission successfully', async () => {
    // Arrange
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

    const permission = Permission.reconstruct({
      id: 'permission-1',
      key: 'user.read',
      displayName: 'Read user',
      description: 'Read user permission',
      status: PermissionStatus.ACTIVE,
      scope: PermissionScope.TENANT,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(tenantRoleRepository.findById).mockResolvedValue(tenantRole);
    vi.mocked(permissionRepository.findById).mockResolvedValue(permission);
    vi.mocked(rolePermissionRepository.exists).mockResolvedValue(false);

    // Act
    const result = await useCase.execute({
      roleId: 'role-1',
      permissionId: 'permission-1',
      grantedBy: 'user-1',
    });

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.success).toBe(true);
    }
    expect(rolePermissionRepository.grant).toHaveBeenCalled();
  });

  it('should return error when permission already granted', async () => {
    // Arrange
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

    const permission = Permission.reconstruct({
      id: 'permission-1',
      key: 'user.read',
      displayName: 'Read user',
      description: 'Read user permission',
      status: PermissionStatus.ACTIVE,
      scope: PermissionScope.TENANT,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(tenantRoleRepository.findById).mockResolvedValue(tenantRole);
    vi.mocked(permissionRepository.findById).mockResolvedValue(permission);
    vi.mocked(rolePermissionRepository.exists).mockResolvedValue(true);

    // Act
    const result = await useCase.execute({
      roleId: 'role-1',
      permissionId: 'permission-1',
      grantedBy: 'user-1',
    });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });
});
