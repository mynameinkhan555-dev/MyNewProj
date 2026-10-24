import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { EmailIdentity } from '../../../domain/index.js';
import { EmailIdentityId } from '../../../domain/EmailIdentityId.js';
import type { IEmailIdentityRepository } from '../../../domain/index.js';
import type { IEventBus } from '../../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import type { ApplicationError } from '../../errors/ApplicationError.js';
import {
  ValidationApplicationError,
  NotFoundApplicationError,
  InternalApplicationError,
} from '../../errors/ApplicationError.js';

export interface VerifyEmailInput {
  emailIdentityId: string;
  verificationToken: string;
}

export interface VerifyEmailOutput {
  success: boolean;
}

export class VerifyEmailUseCase {
  constructor(
    private readonly emailIdentityRepository: IEmailIdentityRepository,
    private readonly eventBus: IEventBus,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(
    input: VerifyEmailInput
  ): Promise<Result<VerifyEmailOutput, ApplicationError>> {
    // Validate input
    if (!input.emailIdentityId || !input.verificationToken) {
      return err(new ValidationApplicationError('Email identity ID and verification token are required'));
    }

    // Find email identity
    const emailIdentity = await this.emailIdentityRepository.findById(new EmailIdentityId(input.emailIdentityId));
    if (!emailIdentity) {
      return err(new NotFoundApplicationError('Email identity not found'));
    }

    // Check if already verified
    if (emailIdentity.verifiedAt !== null) {
      return err(new ValidationApplicationError('Email is already verified'));
    }

    // Verify email
    const now = new Date();
    const clock = { now: () => now };
    const eventIdGenerator = { generate: () => crypto.randomUUID() };
    const verifyResult = emailIdentity.verify(clock, eventIdGenerator);
    if (verifyResult.isErr()) {
      return err(new InternalApplicationError(verifyResult.error.message));
    }

    // Save email identity
    await this.unitOfWork.execute(async () => {
      await this.emailIdentityRepository.update(emailIdentity);
    });

    // Publish EmailIdentityVerified event
    const events = emailIdentity.pullDomainEvents();
    await this.eventBus.publishAll(events);

    return ok({ success: true });
  }
}
