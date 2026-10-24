import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { User, UserStatus, PasswordCredential } from '../../../domain/index.js';
import { UserId } from '../../../domain/UserId.js';
import type { IUserRepository } from '../../../domain/index.js';
import type { IPasswordCredentialRepository } from '../../../domain/index.js';
import type { ISessionRepository } from '../../../domain/index.js';
import type { IPasswordHasher } from '../../../domain/services/IPasswordHasher.js';
import type { IEventBus } from '../../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import type { ApplicationError } from '../../errors/ApplicationError.js';
import {
  ValidationApplicationError,
  NotFoundApplicationError,
  UnauthorizedApplicationError,
  InternalApplicationError,
} from '../../errors/ApplicationError.js';

export interface ChangePasswordInput {
  userId: string;
  oldPassword: string;
  newPassword: string;
}

export interface ChangePasswordOutput {
  success: boolean;
}

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordCredentialRepository: IPasswordCredentialRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly eventBus: IEventBus,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(
    input: ChangePasswordInput
  ): Promise<Result<ChangePasswordOutput, ApplicationError>> {
    // Validate input
    if (!input.userId || !input.oldPassword || !input.newPassword) {
      return err(new ValidationApplicationError('User ID, old password, and new password are required'));
    }

    if (input.newPassword.length < 8) {
      return err(new ValidationApplicationError('New password must be at least 8 characters'));
    }

    if (input.oldPassword === input.newPassword) {
      return err(new ValidationApplicationError('New password must be different from old password'));
    }

    // Find user
    const user = await this.userRepository.findById(new UserId(input.userId));
    if (!user) {
      return err(new NotFoundApplicationError('User not found'));
    }

    // Find password credential
    const passwordCredential = await this.passwordCredentialRepository.findByUserId(user.id);
    if (!passwordCredential) {
      return err(new NotFoundApplicationError('Password credential not found'));
    }

    // Verify old password
    const isValid = await this.passwordHasher.verify(input.oldPassword, passwordCredential.hashedPassword);
    if (!isValid) {
      return err(new UnauthorizedApplicationError('Invalid old password'));
    }

    // Hash new password
    const newHashedPassword = await this.passwordHasher.hash(input.newPassword);

    // Update password credential
    const now = new Date();
    const updatedCredential = PasswordCredential.reconstruct({
      id: passwordCredential.id.value,
      userId: user.id.value,
      hashedPassword: newHashedPassword,
      createdAt: passwordCredential.createdAt,
      updatedAt: now,
    });

    // Revoke all sessions for user (security)
    const sessions = await this.sessionRepository.findByUserId(user.id);
    const nowForRevoke = new Date();
    const clock = { now: () => nowForRevoke };
    const eventIdGenerator = { generate: () => crypto.randomUUID() };

    await this.unitOfWork.execute(async () => {
      await this.passwordCredentialRepository.update(updatedCredential);

      // Revoke all sessions
      for (const session of sessions) {
        const revokeResult = session.revoke(clock, eventIdGenerator);
        if (revokeResult.isOk()) {
          await this.sessionRepository.update(session);
        }
      }
    });

    // TODO: Publish PasswordCredentialChanged event

    return ok({ success: true });
  }
}
