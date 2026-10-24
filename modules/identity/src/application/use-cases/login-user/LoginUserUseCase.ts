import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { User, UserStatus, Session, UserId } from '../../../domain/index.js';
import type { IUserRepository } from '../../../domain/index.js';
import type { IEmailIdentityRepository } from '../../../domain/index.js';
import type { IPasswordCredentialRepository } from '../../../domain/index.js';
import type { ISessionRepository } from '../../../domain/index.js';
import type { IPasswordHasher } from '../../../domain/services/IPasswordHasher.js';
import type { ITokenService } from '../../../domain/services/ITokenService.js';
import type { IEventBus } from '../../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import type { ApplicationError } from '../../errors/ApplicationError.js';
import {
  ValidationApplicationError,
  NotFoundApplicationError,
  UnauthorizedApplicationError,
  InternalApplicationError,
} from '../../errors/ApplicationError.js';

export interface LoginUserInput {
  email: string;
  password: string;
  tenantId?: string;
}

export interface LoginUserOutput {
  userId: string;
  sessionId: string;
  accessToken: string;
  refreshToken: string;
  tenantId?: string;
}

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailIdentityRepository: IEmailIdentityRepository,
    private readonly passwordCredentialRepository: IPasswordCredentialRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly eventBus: IEventBus,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(
    input: LoginUserInput
  ): Promise<Result<LoginUserOutput, ApplicationError>> {
    // Validate input
    if (!input.email || !input.password) {
      return err(new ValidationApplicationError('Email and password are required'));
    }

    // Find email identity
    const emailIdentity = await this.emailIdentityRepository.findByEmail(input.email);
    if (!emailIdentity) {
      return err(new NotFoundApplicationError('Email not found'));
    }

    // Find user
    const user = await this.userRepository.findById(emailIdentity.userId);
    if (!user) {
      return err(new NotFoundApplicationError('User not found'));
    }

    // Check user status
    if (user.status !== UserStatus.ACTIVE) {
      return err(new UnauthorizedApplicationError('User is not active'));
    }

    // Find password credential
    const passwordCredential = await this.passwordCredentialRepository.findByUserId(user.id);
    if (!passwordCredential) {
      return err(new UnauthorizedApplicationError('Password not set'));
    }

    // Verify password
    const isValid = await this.passwordHasher.verify(input.password, passwordCredential.hashedPassword);
    if (!isValid) {
      return err(new UnauthorizedApplicationError('Invalid password'));
    }

    // Create session using domain factory
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const refreshTokenRaw = crypto.randomUUID();
    const refreshTokenHash = await this.passwordHasher.hash(refreshTokenRaw);

    const clock = { now: () => now };
    const idGenerator = { generate: () => crypto.randomUUID() };

    const sessionResult = Session.create(user.id, refreshTokenHash, expiresAt, clock, idGenerator);
    if (sessionResult.isErr()) {
      return err(new InternalApplicationError(sessionResult.error.message));
    }

    const session = sessionResult.value;

    // Save session
    await this.unitOfWork.execute(async () => {
      await this.sessionRepository.insert(session);
    });

    // Generate JWT access token with tenant claim
    const accessToken = await this.tokenService.generateAccessToken({
      userId: user.id.value,
      tenantId: input.tenantId,
    });

    // Generate JWT refresh token with tenant claim
    const refreshTokenStr = await this.tokenService.generateRefreshToken({
      userId: user.id.value,
      tenantId: input.tenantId,
    });

    // TODO: Publish SessionCreated event (if domain emits events)

    return ok({
      userId: user.id.value,
      sessionId: session.id.value,
      accessToken,
      refreshToken: refreshTokenStr,
      tenantId: input.tenantId,
    });
  }
}
