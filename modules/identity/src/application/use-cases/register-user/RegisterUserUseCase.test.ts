import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegisterUserUseCase } from './RegisterUserUseCase.js';
import { User, UserStatus, EmailIdentity, PasswordCredential } from '../../../domain/index.js';
import type { IUserRepository } from '../../../domain/index.js';
import type { IEmailIdentityRepository } from '../../../domain/index.js';
import type { IPasswordCredentialRepository } from '../../../domain/index.js';
import type { IPasswordHasher } from '../../../domain/services/IPasswordHasher.js';
import type { IEventBus } from '../../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import { ValidationApplicationError, ConflictApplicationError } from '../../errors/ApplicationError.js';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let userRepository: IUserRepository;
  let emailIdentityRepository: IEmailIdentityRepository;
  let passwordCredentialRepository: IPasswordCredentialRepository;
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

    // Mock password hasher
    passwordHasher = {
      hash: vi.fn().mockResolvedValue('hashed_password'),
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

    useCase = new RegisterUserUseCase(
      userRepository,
      emailIdentityRepository,
      passwordCredentialRepository,
      passwordHasher,
      eventBus,
      unitOfWork
    );
  });

  it('should register a new user successfully', async () => {
    const input = {
      email: 'test@example.com',
      password: 'password123',
    };

    vi.mocked(emailIdentityRepository.findByEmail).mockResolvedValue(null);

    const result = await useCase.execute(input);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.userId).toBeDefined();
      expect(result.value.email).toBe(input.email);
      expect(result.value.status).toBe(UserStatus.ACTIVE);
    }

    expect(unitOfWork.execute).toHaveBeenCalled();
    expect(userRepository.insert).toHaveBeenCalled();
    expect(emailIdentityRepository.insert).toHaveBeenCalled();
    expect(passwordCredentialRepository.insert).toHaveBeenCalled();
    expect(passwordHasher.hash).toHaveBeenCalledWith(input.password);
  });

  it('should return validation error when email is missing', async () => {
    const input = {
      email: '',
      password: 'password123',
    };

    const result = await useCase.execute(input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationApplicationError);
    }
  });

  it('should return validation error when password is too short', async () => {
    const input = {
      email: 'test@example.com',
      password: 'short',
    };

    const result = await useCase.execute(input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationApplicationError);
    }
  });

  it('should return conflict error when email already exists', async () => {
    const input = {
      email: 'existing@example.com',
      password: 'password123',
    };

    vi.mocked(emailIdentityRepository.findByEmail).mockResolvedValue(
      EmailIdentity.reconstruct({
        id: crypto.randomUUID(),
        userId: crypto.randomUUID(),
        email: 'existing@example.com',
        verifiedAt: null,
        primary: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    const result = await useCase.execute(input);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ConflictApplicationError);
    }
  });
});
