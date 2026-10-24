import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateTenantUseCase } from './CreateTenantUseCase.js';
import { Tenant, TenantStatus, Membership, MembershipStatus } from '../../domain/index.js';
import { TenantId } from '../../domain/index.js';
import { MembershipId } from '../../domain/index.js';
import type { ITenantRepository } from '../../domain/index.js';
import type { IMembershipRepository } from '../../domain/index.js';
import type { IEventBus } from '../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import { ValidationApplicationError } from '../errors/ApplicationError.js';

describe('CreateTenantUseCase', () => {
  let useCase: CreateTenantUseCase;
  let tenantRepository: ITenantRepository;
  let membershipRepository: IMembershipRepository;
  let eventBus: IEventBus;
  let unitOfWork: IUnitOfWork;

  beforeEach(() => {
    // Mock repositories
    tenantRepository = {
      insert: vi.fn(),
      findById: vi.fn(),
      findByName: vi.fn(),
    } as unknown as ITenantRepository;

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

    useCase = new CreateTenantUseCase(
      tenantRepository,
      membershipRepository,
      eventBus,
      unitOfWork
    );
  });

  it('should create tenant successfully', async () => {
    // Arrange
    const input = {
      name: 'Test Tenant',
      ownerUserId: 'user-1',
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.tenantId).toBeDefined();
      expect(result.value.membershipId).toBeDefined();
    }
    expect(tenantRepository.insert).toHaveBeenCalled();
    expect(membershipRepository.insert).toHaveBeenCalled();
  });

  it('should return validation error when name is too short', async () => {
    // Arrange
    const input = {
      name: 'AB',
      ownerUserId: 'user-1',
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationApplicationError);
    }
  });

  it('should return validation error when name is missing', async () => {
    // Arrange
    const input = {
      name: '',
      ownerUserId: 'user-1',
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationApplicationError);
    }
  });

  it('should return validation error when ownerUserId is missing', async () => {
    // Arrange
    const input = {
      name: 'Test Tenant',
      ownerUserId: '',
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
