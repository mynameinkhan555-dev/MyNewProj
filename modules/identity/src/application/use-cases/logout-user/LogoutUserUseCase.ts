import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { Session } from '../../../domain/index.js';
import { SessionId } from '../../../domain/SessionId.js';
import type { ISessionRepository } from '../../../domain/index.js';
import type { IEventBus } from '../../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import type { ApplicationError } from '../../errors/ApplicationError.js';
import {
  ValidationApplicationError,
  NotFoundApplicationError,
  InternalApplicationError,
} from '../../errors/ApplicationError.js';

export interface LogoutUserInput {
  sessionId: string;
}

export interface LogoutUserOutput {
  success: boolean;
}

export class LogoutUserUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly eventBus: IEventBus,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(
    input: LogoutUserInput
  ): Promise<Result<LogoutUserOutput, ApplicationError>> {
    // Validate input
    if (!input.sessionId) {
      return err(new ValidationApplicationError('Session ID is required'));
    }

    // Find session
    const session = await this.sessionRepository.findById(new SessionId(input.sessionId));
    if (!session) {
      return err(new NotFoundApplicationError('Session not found'));
    }

    // Revoke session
    const now = new Date();
    const clock = { now: () => now };
    const eventIdGenerator = { generate: () => crypto.randomUUID() };
    const revokeResult = session.revoke(clock, eventIdGenerator);
    if (revokeResult.isErr()) {
      return err(new InternalApplicationError(revokeResult.error.message));
    }

    // Save session
    await this.unitOfWork.execute(async () => {
      await this.sessionRepository.update(session);
    });

    // Publish SessionRevoked event
    const events = session.pullDomainEvents();
    await this.eventBus.publishAll(events);

    return ok({ success: true });
  }
}
