import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VerifyEmailUseCase } from './VerifyEmailUseCase.js';
import { EmailIdentity } from '../../../domain/index.js';
import { EmailIdentityId } from '../../../domain/index.js';
import { UserId } from '../../../domain/index.js';
import { Email } from '../../../domain/index.js';
import type { IEmailIdentityRepository } from '../../../domain/index.js';
import type { IEventBus } from '../../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import { ValidationApplicationError, NotFoundApplicationError } from '../../errors/ApplicationError.js';

describe('VerifyEmailUseCase', () => {
  let useCase: VerifyEmailUseCase;
  let emailIdentityRepository: IEmailIdentityRepository;
  let eventBus: IEventBus;
  let unitOfWork: IUnitOfWork;

  beforeEach(() => {
    // Mock email identity repository
    emailIdentityRepository = {
      insert: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
    } as unknown as IEmailIdentityRepository;

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

    useCase = new VerifyEmailUseCase(
      emailIdentityRepository,
      eventBus,
      unitOfWork
    );
  });

  it('should verify email successfully', async () => {
    // Arrange
    const emailIdentityId = new EmailIdentityId('email-1');
    const userId = new UserId('user-1');
    const emailIdentity = EmailIdentity.reconstruct({
      id: emailIdentityId.value,
      userId: userId.value,
      email: 'test@example.com',
      verifiedAt: null,
      primary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(emailIdentityRepository.findById).mockResolvedValue(emailIdentity);

    // Act
    const result = await useCase.execute({
      emailIdentityId: emailIdentityId.value,
      verificationToken: 'token',
    });

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.success).toBe(true);
    }
    expect(emailIdentityRepository.update).toHaveBeenCalled();
    expect(eventBus.publishAll).toHaveBeenCalled();
  });

  it('should return error when email identity is not found', async () => {
    // Arrange
    vi.mocked(emailIdentityRepository.findById).mockResolvedValue(null);

    // Act
    const result = await useCase.execute({
      emailIdentityId: 'notfound',
      verificationToken: 'token',
    });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(NotFoundApplicationError);
    }
  });

  it('should return error when email is already verified', async () => {
    // Arrange
    const emailIdentityId = new EmailIdentityId('email-1');
    const userId = new UserId('user-1');
    const emailIdentity = EmailIdentity.reconstruct({
      id: emailIdentityId.value,
      userId: userId.value,
      email: 'test@example.com',
      verifiedAt: new Date(),
      primary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(emailIdentityRepository.findById).mockResolvedValue(emailIdentity);

    // Act
    const result = await useCase.execute({
      emailIdentityId: emailIdentityId.value,
      verificationToken: 'token',
    });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationApplicationError);
    }
  });

  it('should return validation error when input is missing', async () => {
    // Act
    const result = await useCase.execute({
      emailIdentityId: '',
      verificationToken: '',
    });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationApplicationError);
    }
  });
});
