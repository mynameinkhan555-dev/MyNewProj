import { RegisterUserUseCase } from '@workspace/identity/application/use-cases/index.js';
import { LoginUserUseCase } from '@workspace/identity/application/use-cases/index.js';
import { LogoutUserUseCase } from '@workspace/identity/application/use-cases/index.js';
import { VerifyEmailUseCase } from '@workspace/identity/application/use-cases/index.js';
import { ChangePasswordUseCase } from '@workspace/identity/application/use-cases/index.js';
import { DrizzleUserRepository } from '@workspace/identity/infrastructure/persistence/drizzle/repositories';
import { DrizzleEmailIdentityRepository } from '@workspace/identity/infrastructure/persistence/drizzle/repositories';
import { DrizzlePasswordCredentialRepository } from '@workspace/identity/infrastructure/persistence/drizzle/repositories';
import { DrizzleSessionRepository } from '@workspace/identity/infrastructure/persistence/drizzle/repositories';
import type { IUserRepository } from '@workspace/identity/domain/repositories';
import type { IEmailIdentityRepository } from '@workspace/identity/domain/repositories';
import type { IPasswordCredentialRepository } from '@workspace/identity/domain/repositories';
import type { ISessionRepository } from '@workspace/identity/domain/repositories';
import type { DrizzleDB } from '@workspace/platform-database';
import { DrizzleUnitOfWork } from '@workspace/platform-database/unitOfWork/DrizzleUnitOfWork';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';
import { InMemoryEventBus } from '@workspace/access-control/infrastructure/event-bus/InMemoryEventBus';
import { BcryptPasswordHasher, JwtTokenService } from '@workspace/identity/domain';
import type { IPasswordHasher, ITokenService } from '@workspace/identity/domain';

export class IdentityContainer {
  readonly userRepository: IUserRepository;
  readonly emailIdentityRepository: IEmailIdentityRepository;
  readonly passwordCredentialRepository: IPasswordCredentialRepository;
  readonly sessionRepository: ISessionRepository;
  readonly unitOfWork: DrizzleUnitOfWork;
  readonly transactionContext: TransactionContext;
  readonly eventBus: InMemoryEventBus;
  readonly passwordHasher: IPasswordHasher;
  readonly tokenService: ITokenService;
  
  constructor(db: DrizzleDB) {
    this.unitOfWork = new DrizzleUnitOfWork(db);
    this.transactionContext = this.unitOfWork.getContext();
    this.eventBus = new InMemoryEventBus();
    this.passwordHasher = new BcryptPasswordHasher();
    this.tokenService = new JwtTokenService(process.env.JWT_SECRET || 'default-secret');
    
    this.userRepository = new DrizzleUserRepository(this.transactionContext);
    this.emailIdentityRepository = new DrizzleEmailIdentityRepository(this.transactionContext);
    this.passwordCredentialRepository = new DrizzlePasswordCredentialRepository(this.transactionContext);
    this.sessionRepository = new DrizzleSessionRepository(this.transactionContext);
  }

  getRegisterUserUseCase() {
    return new RegisterUserUseCase(
      this.userRepository,
      this.emailIdentityRepository,
      this.passwordCredentialRepository,
      this.passwordHasher,
      this.eventBus,
      this.unitOfWork
    );
  }

  getLoginUserUseCase() {
    return new LoginUserUseCase(
      this.userRepository,
      this.emailIdentityRepository,
      this.passwordCredentialRepository,
      this.sessionRepository,
      this.passwordHasher,
      this.tokenService,
      this.eventBus,
      this.unitOfWork
    );
  }

  getLogoutUserUseCase() {
    return new LogoutUserUseCase(
      this.sessionRepository,
      this.eventBus,
      this.unitOfWork
    );
  }

  getVerifyEmailUseCase() {
    return new VerifyEmailUseCase(
      this.emailIdentityRepository,
      this.eventBus,
      this.unitOfWork
    );
  }

  getChangePasswordUseCase() {
    return new ChangePasswordUseCase(
      this.userRepository,
      this.passwordCredentialRepository,
      this.sessionRepository,
      this.passwordHasher,
      this.eventBus,
      this.unitOfWork
    );
  }
}

export const identityContainer = new IdentityContainer(null as any);
