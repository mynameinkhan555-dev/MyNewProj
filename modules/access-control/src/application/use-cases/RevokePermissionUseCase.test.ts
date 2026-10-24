import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RevokePermissionUseCase } from './RevokePermissionUseCase.js';
import { TenantRole, TenantRoleStatus } from '../../domain/index.js';
import { Permission, PermissionStatus } from '../../domain/index.js';
import type { IRolePermissionRepository } from '../../domain/index.js';
import type { IEventBus } from '../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import { ValidationApplicationError, NotFoundApplicationError } from '../errors/ApplicationError.js';

describe('RevokePermissionUseCase', () => {
  let useCase: RevokePermissionUseCase;
  let rolePermissionRepository: IRolePermissionRepository;
  let eventBus: IEventBus;
  let unitOfWork: IUnitOfWork;

  beforeEach(() => {
    // Mock role permission repository
    rolePermissionRepository = {
      exists: vi.fn(),
      grant: vi.fn(),
      revoke: vi.fn().mockResolvedValue(undefined),
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

    useCase = new RevokePermissionUseCase(
      rolePermissionRepository,
      eventBus,
      unitOfWork
    );
  });

  it('should revoke permission successfully', async () => {
    // Arrange
    vi.mocked(rolePermissionRepository.exists).mockResolvedValue(true);

    // Act
    const result = await useCase.execute({
      roleId: 'role-1',
      permissionId: 'permission-1',
      revokedBy: 'user-1',
    });

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.success).toBe(true);
    }
    expect(rolePermissionRepository.revoke).toHaveBeenCalled();
  });

  it('should return error when permission not granted', async () => {
    // Arrange
    vi.mocked(rolePermissionRepository.exists).mockResolvedValue(false);

    // Act
    const result = await useCase.execute({
      roleId: 'role-1',
      permissionId: 'permission-1',
      revokedBy: 'user-1',
    });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(NotFoundApplicationError);
    }
  });

  it('should return validation error when roleId is missing', async () => {
    // Act
    const result = await useCase.execute({
      roleId: '',
      permissionId: 'permission-1',
      revokedBy: 'user-1',
    });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationApplicationError);
    }
  });
});
