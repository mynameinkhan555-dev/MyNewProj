import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChangePasswordUseCase } from './ChangePasswordUseCase.js';
import { User, UserStatus, PasswordCredential } from '../../../domain/index.js';
import { UserId } from '../../../domain/index.js';
import { Session } from '../../../domain/index.js';
import type { IUserRepository } from '../../../domain/index.js';
import type { IPasswordCredentialRepository } from '../../../domain/index.js';
import type { ISessionRepository } from '../../../domain/index.js';
import type { IPasswordHasher } from '../../../domain/services/IPasswordHasher.js';
import type { IEventBus } from '../../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import { ValidationApplicationError, NotFoundApplicationError, UnauthorizedApplicationError } from '../../errors/ApplicationError.js';

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let userRepository: IUserRepository;
  let passwordCredentialRepository: IPasswordCredentialRepository;
  let sessionRepository: ISessionRepository;
  let passwordHasher: IPasswordHasher;
  let eventBus: IEventBus;
  let unitOfWork: IUnitOfWork;

  beforeEach(() => {
    // Mock repositories
    userRepository = {
      insert: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
    } as unknown as IUserRepository;

    passwordCredentialRepository = {
      insert: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      update: vi.fn(),
    } as unknown as IPasswordCredentialRepository;

    sessionRepository = {
      insert: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      update: vi.fn(),
    } as unknown as ISessionRepository;

    // Mock password hasher
    passwordHasher = {
      hash: vi.fn().mockResolvedValue('new_hashed_password'),
      verify: vi.fn(),
    };

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

    useCase = new ChangePasswordUseCase(
      userRepository,
      passwordCredentialRepository,
      sessionRepository,
      passwordHasher,
      eventBus,
      unitOfWork
    );
  });

  it('should change password successfully', async () => {
    // Arrange
    const userId = new UserId('user-1');
    const user = User.reconstruct({
      id: userId.value,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0,
    });

    const passwordCredential = PasswordCredential.reconstruct({
      id: 'cred-1',
      userId: userId.value,
      hashedPassword: 'old_hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(userRepository.findById).mockResolvedValue(user);
    vi.mocked(passwordCredentialRepository.findByUserId).mockResolvedValue(passwordCredential);
    vi.mocked(passwordHasher.verify).mockResolvedValue(true);
    vi.mocked(sessionRepository.findByUserId).mockResolvedValue([]);

    // Act
    const result = await useCase.execute({
      userId: userId.value,
      oldPassword: 'oldpassword',
      newPassword: 'newpassword123',
    });

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.success).toBe(true);
    }
    expect(passwordHasher.hash).toHaveBeenCalledWith('newpassword123');
    expect(passwordCredentialRepository.update).toHaveBeenCalled();
  });

  it('should revoke all sessions when password is changed', async () => {
    // Arrange
    const userId = new UserId('user-1');
    const user = User.reconstruct({
      id: userId.value,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0,
    });

    const passwordCredential = PasswordCredential.reconstruct({
      id: 'cred-1',
      userId: userId.value,
      hashedPassword: 'old_hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const session = Session.reconstruct({
      id: 'session-1',
      userId: userId.value,
      refreshTokenHash: 'hashed_token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(userRepository.findById).mockResolvedValue(user);
    vi.mocked(passwordCredentialRepository.findByUserId).mockResolvedValue(passwordCredential);
    vi.mocked(passwordHasher.verify).mockResolvedValue(true);
    vi.mocked(sessionRepository.findByUserId).mockResolvedValue([session]);

    // Act
    const result = await useCase.execute({
      userId: userId.value,
      oldPassword: 'oldpassword',
      newPassword: 'newpassword123',
    });

    // Assert
    expect(result.isOk()).toBe(true);
    expect(sessionRepository.update).toHaveBeenCalled();
  });

  it('should return error when old password is invalid', async () => {
    // Arrange
    const userId = new UserId('user-1');
    const user = User.reconstruct({
      id: userId.value,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0,
    });

    const passwordCredential = PasswordCredential.reconstruct({
      id: 'cred-1',
      userId: userId.value,
      hashedPassword: 'old_hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(userRepository.findById).mockResolvedValue(user);
    vi.mocked(passwordCredentialRepository.findByUserId).mockResolvedValue(passwordCredential);
    vi.mocked(passwordHasher.verify).mockResolvedValue(false);

    // Act
    const result = await useCase.execute({
      userId: userId.value,
      oldPassword: 'wrongpassword',
      newPassword: 'newpassword123',
    });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(UnauthorizedApplicationError);
    }
  });

  it('should return validation error when new password is too short', async () => {
    // Act
    const result = await useCase.execute({
      userId: 'user-1',
      oldPassword: 'oldpassword',
      newPassword: 'short',
    });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationApplicationError);
    }
  });

  it('should return validation error when old and new password are the same', async () => {
    // Act
    const result = await useCase.execute({
      userId: 'user-1',
      oldPassword: 'password123',
      newPassword: 'password123',
    });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationApplicationError);
    }
  });
});
