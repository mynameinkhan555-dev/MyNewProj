import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AcceptInvitationUseCase } from './AcceptInvitationUseCase.js';
import { Membership, MembershipStatus } from '../../domain/index.js';
import { MembershipId } from '../../domain/index.js';
import type { IMembershipRepository } from '../../domain/index.js';
import type { IEventBus } from '../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import { ValidationApplicationError, NotFoundApplicationError } from '../errors/ApplicationError.js';

describe('AcceptInvitationUseCase', () => {
  let useCase: AcceptInvitationUseCase;
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

    useCase = new AcceptInvitationUseCase(
      membershipRepository,
      eventBus,
      unitOfWork
    );
  });

  it('should accept invitation successfully', async () => {
    // Arrange
    const membership = Membership.reconstruct({
      id: 'membership-1',
      userId: 'pending_user',
      tenantId: 'tenant-1',
      status: MembershipStatus.ACTIVE,
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(membershipRepository.findById).mockResolvedValue(membership);

    // Act
    const result = await useCase.execute({
      invitationToken: 'membership-1',
      userId: 'user-1',
    });

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.membershipId).toBeDefined();
    }
    expect(membershipRepository.update).toHaveBeenCalled();
  });

  it('should return error when invitation is not found', async () => {
    // Arrange
    vi.mocked(membershipRepository.findById).mockResolvedValue(null);

    // Act
    const result = await useCase.execute({
      invitationToken: 'notfound',
      userId: 'user-1',
    });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(NotFoundApplicationError);
    }
  });

  it('should return validation error when token is missing', async () => {
    // Act
    const result = await useCase.execute({
      invitationToken: '',
      userId: 'user-1',
    });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationApplicationError);
    }
  });
});
