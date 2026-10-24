import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InviteMemberUseCase } from './InviteMemberUseCase.js';
import { Membership, MembershipStatus } from '../../domain/index.js';
import { MembershipId } from '../../domain/index.js';
import type { IMembershipRepository } from '../../domain/index.js';
import type { IEventBus } from '../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import { ValidationApplicationError } from '../errors/ApplicationError.js';

describe('InviteMemberUseCase', () => {
  let useCase: InviteMemberUseCase;
  let membershipRepository: IMembershipRepository;
  let eventBus: IEventBus;
  let unitOfWork: IUnitOfWork;

  beforeEach(() => {
    // Mock membership repository
    membershipRepository = {
      insert: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findByUserIdAndTenantId: vi.fn(),
      update: vi.fn(),
    } as unknown as IMembershipRepository;

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

    useCase = new InviteMemberUseCase(
      membershipRepository,
      eventBus,
      unitOfWork
    );
  });

  it('should invite member successfully', async () => {
    // Arrange
    const input = {
      tenantId: 'tenant-1',
      email: 'new@example.com',
      roleId: 'role-1',
      invitedBy: 'user-1',
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.invitationId).toBeDefined();
    }
    expect(membershipRepository.insert).toHaveBeenCalled();
  });

  it('should return validation error when tenantId is missing', async () => {
    // Arrange
    const input = {
      tenantId: '',
      email: 'new@example.com',
      roleId: 'role-1',
      invitedBy: 'user-1',
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationApplicationError);
    }
  });

  it('should return validation error when email is missing', async () => {
    // Arrange
    const input = {
      tenantId: 'tenant-1',
      email: '',
      roleId: 'role-1',
      invitedBy: 'user-1',
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationApplicationError);
    }
  });
});
