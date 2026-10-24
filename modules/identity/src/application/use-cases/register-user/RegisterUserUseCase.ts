import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { User, UserStatus, EmailIdentity, PasswordCredential } from '../../../domain/index.js';
import type { IUserRepository } from '../../../domain/index.js';
import type { IEmailIdentityRepository } from '../../../domain/index.js';
import type { IPasswordCredentialRepository } from '../../../domain/index.js';
import type { IPasswordHasher } from '../../../domain/services/IPasswordHasher.js';
import type { IEventBus } from '../../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import type { ApplicationError } from '../../errors/ApplicationError.js';
import {
  ValidationApplicationError,
  ConflictApplicationError,
  InternalApplicationError,
} from '../../errors/ApplicationError.js';

export interface RegisterUserInput {
  email: string;
  password: string;
  displayName?: string;
}

export interface RegisterUserOutput {
  userId: string;
  email: string;
  status: UserStatus;
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailIdentityRepository: IEmailIdentityRepository,
    private readonly passwordCredentialRepository: IPasswordCredentialRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly eventBus: IEventBus,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(
    input: RegisterUserInput
  ): Promise<Result<RegisterUserOutput, ApplicationError>> {
    // Validate input
    if (!input.email || !input.password) {
      return err(new ValidationApplicationError('Email and password are required'));
    }

    if (input.password.length < 8) {
      return err(new ValidationApplicationError('Password must be at least 8 characters'));
    }

    // Check email uniqueness
    const existingEmailIdentity = await this.emailIdentityRepository.findByEmail(input.email);
    if (existingEmailIdentity) {
      return err(new ConflictApplicationError('Email is already registered'));
    }

    // Hash password
    const hashedPassword = await this.passwordHasher.hash(input.password);

    // Create aggregates separately (using reconstruct for now)
    const now = new Date();
    const userId = crypto.randomUUID();

    // Create User
    const user = User.reconstruct({
      id: userId,
      status: UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });

    // Create EmailIdentity
    const emailIdentity = EmailIdentity.reconstruct({
      id: crypto.randomUUID(),
      userId: userId,
      email: input.email,
      verifiedAt: null,
      primary: true,
      createdAt: now,
      updatedAt: now,
    });

    // Create PasswordCredential
    const passwordCredential = PasswordCredential.reconstruct({
      id: crypto.randomUUID(),
      userId: userId,
      hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    // Save in transaction
    await this.unitOfWork.execute(async () => {
      await this.userRepository.insert(user);
      await this.emailIdentityRepository.insert(emailIdentity);
      await this.passwordCredentialRepository.insert(passwordCredential);
    });

    // TODO: Publish UserCreated, EmailIdentityCreated, PasswordCredentialCreated events

    return ok({
      userId: user.id.value,
      email: input.email,
      status: user.status,
    });
  }
}
