import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoginUserUseCase } from './LoginUserUseCase.js';
import { User, UserStatus, Session, EmailIdentity, PasswordCredential } from '../../../domain/index.js';
import { UserId, EmailIdentityId } from '../../../domain/index.js';
import { Email } from '../../../domain/index.js';
import type { IUserRepository } from '../../../domain/index.js';
import type { IEmailIdentityRepository } from '../../../domain/index.js';
import type { IPasswordCredentialRepository } from '../../../domain/index.js';
import type { ISessionRepository } from '../../../domain/index.js';
import type { IPasswordHasher } from '../../../domain/services/IPasswordHasher.js';
import type { ITokenService } from '../../../domain/services/ITokenService.js';
import type { IEventBus } from '../../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import { ValidationApplicationError, NotFoundApplicationError, UnauthorizedApplicationError } from '../../errors/ApplicationError.js';

describe('LoginUserUseCase', () => {
  let useCase: LoginUserUseCase;
  let userRepository: IUserRepository;
  let emailIdentityRepository: IEmailIdentityRepository;
  let passwordCredentialRepository: IPasswordCredentialRepository;
  let sessionRepository: ISessionRepository;
  let passwordHasher: IPasswordHasher;
  let tokenService: ITokenService;
  let eventBus: IEventBus;
  let unitOfWork: IUnitOfWork;

  beforeEach(() => {
    // Mock repositories
    userRepository = {
      insert: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
    } as unknown as IUserRepository;

    emailIdentityRepository = {
      insert: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
    } as unknown as IEmailIdentityRepository;

    passwordCredentialRepository = {
      insert: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
    } as unknown as IPasswordCredentialRepository;

    sessionRepository = {
      insert: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
    } as unknown as ISessionRepository;

    // Mock password hasher
    passwordHasher = {
      hash: vi.fn().mockResolvedValue('hashed_password'),
      verify: vi.fn(),
    };

    // Mock token service
    tokenService = {
      generateAccessToken: vi.fn().mockResolvedValue('access_token'),
      generateRefreshToken: vi.fn().mockResolvedValue('refresh_token'),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
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

    useCase = new LoginUserUseCase(
      userRepository,
      emailIdentityRepository,
      passwordCredentialRepository,
      sessionRepository,
      passwordHasher,
      tokenService,
      eventBus,
      unitOfWork
    );
  });

  it('should login successfully with valid credentials', async () => {
    // Arrange
    const email = 'test@example.com';
    const password = 'password123';
    const userId = new UserId('user-1');

    const emailIdentity = EmailIdentity.reconstruct({
      id: 'email-1',
      userId: userId.value,
      email: email,
      verifiedAt: null,
      primary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

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
      hashedPassword: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(emailIdentityRepository.findByEmail).mockResolvedValue(emailIdentity);
    vi.mocked(userRepository.findById).mockResolvedValue(user);
    vi.mocked(passwordCredentialRepository.findByUserId).mockResolvedValue(passwordCredential);
    vi.mocked(passwordHasher.verify).mockResolvedValue(true);

    // Act
    const result = await useCase.execute({ email, password });

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.userId).toBe(userId.value);
      expect(result.value.sessionId).toBeDefined();
      expect(result.value.accessToken).toBeDefined();
      expect(result.value.refreshToken).toBeDefined();
    }
  });

  it('should return error when email is not found', async () => {
    // Arrange
    vi.mocked(emailIdentityRepository.findByEmail).mockResolvedValue(null);

    // Act
    const result = await useCase.execute({ email: 'notfound@example.com', password: 'password' });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(NotFoundApplicationError);
    }
  });

  it('should return error when user is not active', async () => {
    // Arrange
    const userId = new UserId('user-1');
    const emailIdentity = EmailIdentity.reconstruct({
      id: 'email-1',
      userId: userId.value,
      email: 'test@example.com',
      verifiedAt: null,
      primary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const user = User.reconstruct({
      id: userId.value,
      status: UserStatus.SUSPENDED,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 0,
    });

    vi.mocked(emailIdentityRepository.findByEmail).mockResolvedValue(emailIdentity);
    vi.mocked(userRepository.findById).mockResolvedValue(user);

    // Act
    const result = await useCase.execute({ email: 'test@example.com', password: 'password' });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(UnauthorizedApplicationError);
    }
  });

  it('should return error when password is invalid', async () => {
    // Arrange
    const userId = new UserId('user-1');
    const emailIdentity = EmailIdentity.reconstruct({
      id: 'email-1',
      userId: userId.value,
      email: 'test@example.com',
      verifiedAt: null,
      primary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

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
      hashedPassword: 'hashed_password',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(emailIdentityRepository.findByEmail).mockResolvedValue(emailIdentity);
    vi.mocked(userRepository.findById).mockResolvedValue(user);
    vi.mocked(passwordCredentialRepository.findByUserId).mockResolvedValue(passwordCredential);
    vi.mocked(passwordHasher.verify).mockResolvedValue(false);

    // Act
    const result = await useCase.execute({ email: 'test@example.com', password: 'wrongpassword' });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(UnauthorizedApplicationError);
    }
  });

  it('should return validation error when email or password is missing', async () => {
    // Act
    const result = await useCase.execute({ email: '', password: '' });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationApplicationError);
    }
  });
});
