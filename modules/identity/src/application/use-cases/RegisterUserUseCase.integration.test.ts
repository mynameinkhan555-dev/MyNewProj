import { describe, it, expect, beforeEach, afterEach } from 'vitest';
// import { RegisterUserUseCase } from './RegisterUserUseCase.js';
// import { DrizzleUserRepository } from '../../../infrastructure/persistence/drizzle/repositories/DrizzleUserRepository.js';
// import { DrizzleEmailIdentityRepository } from '../../../infrastructure/persistence/drizzle/repositories/DrizzleEmailIdentityRepository.js';
// import { DrizzlePasswordCredentialRepository } from '../../../infrastructure/persistence/drizzle/repositories/DrizzlePasswordCredentialRepository.js';
// import { DrizzleSessionRepository } from '../../../infrastructure/persistence/drizzle/repositories/DrizzleSessionRepository.js';
// import { BcryptPasswordHasher } from '../../../infrastructure/security/BcryptPasswordHasher.js';
// import { MockUnitOfWork } from '../../../../../packages/tooling/test-utils/src/mocks/mock-unit-of-work.js';
// import { MockEventBus } from '../../../../../packages/tooling/test-utils/src/mocks/mock-event-bus.js';

describe('RegisterUserUseCase - Integration', () => {
  // let useCase: RegisterUserUseCase;
  // let unitOfWork: MockUnitOfWork;
  // let eventBus: MockEventBus;
  // let userRepo: DrizzleUserRepository;
  // let emailIdentityRepo: DrizzleEmailIdentityRepository;
  // let passwordCredentialRepo: DrizzlePasswordCredentialRepository;
  // let sessionRepo: DrizzleSessionRepository;
  // let passwordHasher: BcryptPasswordHasher;

  beforeEach(() => {
    // TODO: Setup real PostgreSQL connection
    // TODO: Setup test database schema
    // TODO: Setup repositories with real DB connection
    // unitOfWork = new MockUnitOfWork();
    // eventBus = new MockEventBus();
    // passwordHasher = new BcryptPasswordHasher();
    
    // TODO: Initialize repositories with real DB
    // userRepo = new DrizzleUserRepository(db);
    // emailIdentityRepo = new DrizzleEmailIdentityRepository(db);
    // passwordCredentialRepo = new DrizzlePasswordCredentialRepository(db);
    // sessionRepo = new DrizzleSessionRepository(db);
    
    // useCase = new RegisterUserUseCase(
    //   userRepo,
    //   emailIdentityRepo,
    //   passwordCredentialRepo,
    //   sessionRepo,
    //   passwordHasher,
    //   unitOfWork,
    //   eventBus
    // );
  });

  afterEach(async () => {
    // TODO: Cleanup test database
    // TODO: Close DB connection
  });

  it('should register a new user with email and password', async () => {
    // Arrange
    const email = 'test@example.com';
    const password = 'SecurePassword123!';
    const firstName = 'John';
    const lastName = 'Doe';

    // Act
    // const result = await useCase.execute({
    //   email,
    //   password,
    //   firstName,
    //   lastName,
    // });

    // Assert
    // expect(result.isOk()).toBe(true);
    // if (result.isOk()) {
    //   expect(result.value.user).toBeDefined();
    //   expect(result.value.user.email).toBe(email);
    //   expect(result.value.session).toBeDefined();
    // }
  });

  it('should fail if email already exists', async () => {
    // Arrange
    const email = 'existing@example.com';
    const password = 'SecurePassword123!';

    // Act
    // const result = await useCase.execute({
    //   email,
    //   password,
    //   firstName: 'John',
    //   lastName: 'Doe',
    // });

    // Assert
    // expect(result.isErr()).toBe(true);
  });

  it('should fail if password is too weak', async () => {
    // Arrange
    const email = 'test@example.com';
    const password = 'weak';

    // Act
    // const result = await useCase.execute({
    //   email,
    //   password,
    //   firstName: 'John',
    //   lastName: 'Doe',
    // });

    // Assert
    // expect(result.isErr()).toBe(true);
  });
});
