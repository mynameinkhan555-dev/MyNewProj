import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LogoutUserUseCase } from './LogoutUserUseCase.js';
import { Session } from '../../../domain/index.js';
import { SessionId } from '../../../domain/index.js';
import { UserId } from '../../../domain/index.js';
import type { ISessionRepository } from '../../../domain/index.js';
import type { IEventBus } from '../../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import { ValidationApplicationError, NotFoundApplicationError } from '../../errors/ApplicationError.js';

describe('LogoutUserUseCase', () => {
  let useCase: LogoutUserUseCase;
  let sessionRepository: ISessionRepository;
  let eventBus: IEventBus;
  let unitOfWork: IUnitOfWork;

  beforeEach(() => {
    // Mock session repository
    sessionRepository = {
      insert: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      update: vi.fn(),
    } as unknown as ISessionRepository;

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

    useCase = new LogoutUserUseCase(
      sessionRepository,
      eventBus,
      unitOfWork
    );
  });

  it('should logout successfully with valid session', async () => {
    // Arrange
    const sessionId = new SessionId('session-1');
    const userId = new UserId('user-1');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const session = Session.reconstruct({
      id: sessionId.value,
      userId: userId.value,
      refreshTokenHash: 'hashed_token',
      expiresAt,
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    vi.mocked(sessionRepository.findById).mockResolvedValue(session);

    // Act
    const result = await useCase.execute({ sessionId: sessionId.value });

    // Assert
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.success).toBe(true);
    }
    expect(sessionRepository.update).toHaveBeenCalled();
    expect(eventBus.publishAll).toHaveBeenCalled();
  });

  it('should return error when session is not found', async () => {
    // Arrange
    vi.mocked(sessionRepository.findById).mockResolvedValue(null);

    // Act
    const result = await useCase.execute({ sessionId: 'notfound' });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(NotFoundApplicationError);
    }
  });

  it('should return validation error when sessionId is missing', async () => {
    // Act
    const result = await useCase.execute({ sessionId: '' });

    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ValidationApplicationError);
    }
  });
});
