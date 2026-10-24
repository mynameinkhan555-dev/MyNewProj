import { AssignRoleUseCase } from '@workspace/access-control/application/use-cases/index.js';
import { GrantPermissionUseCase } from '@workspace/access-control/application/use-cases/index.js';
import { RevokePermissionUseCase } from '@workspace/access-control/application/use-cases/index.js';
import { CheckPermissionUseCase } from '@workspace/access-control/application/use-cases/index.js';
import { DrizzlePermissionRepository } from '@workspace/access-control/infrastructure/persistence/drizzle/repositories/index.js';
import { DrizzleTenantRoleRepository } from '@workspace/access-control/infrastructure/persistence/drizzle/repositories/index.js';
import { DrizzleRoleAssignmentRepository } from '@workspace/access-control/infrastructure/persistence/drizzle/repositories/index.js';
import { DrizzleRolePermissionRepository } from '@workspace/access-control/infrastructure/persistence/drizzle/repositories/index.js';
import { DrizzleUnitOfWork } from '@workspace/platform-database/unitOfWork/DrizzleUnitOfWork';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';
import { InMemoryEventBus } from '@workspace/access-control/infrastructure/event-bus/InMemoryEventBus.js';
import type { DrizzleDB } from '@workspace/platform-database';
import type { IUnitOfWork } from '@workspace/platform';
import type { IMembershipRepository } from '@workspace/tenant/domain/repositories';
import type { ITenantRepository } from '@workspace/tenant/domain/repositories';
import type { IUserRepository } from '@workspace/identity/domain/repositories';

export class AuthorizationContainer {
  readonly permissionRepository: DrizzlePermissionRepository;
  readonly tenantRoleRepository: DrizzleTenantRoleRepository;
  readonly roleAssignmentRepository: DrizzleRoleAssignmentRepository;
  readonly rolePermissionRepository: DrizzleRolePermissionRepository;
  readonly unitOfWork: IUnitOfWork;
  readonly transactionContext: TransactionContext;
  readonly eventBus: InMemoryEventBus;
  
  readonly assignRoleUseCase: AssignRoleUseCase;
  readonly grantPermissionUseCase: GrantPermissionUseCase;
  readonly revokePermissionUseCase: RevokePermissionUseCase;
  readonly checkPermissionUseCase: CheckPermissionUseCase;

  constructor(
    db: DrizzleDB,
    membershipRepository: IMembershipRepository,
    tenantRepository: ITenantRepository,
    userRepository: IUserRepository
  ) {
    const drizzleUnitOfWork = new DrizzleUnitOfWork(db);
    this.unitOfWork = drizzleUnitOfWork;
    this.transactionContext = drizzleUnitOfWork.getContext();
    this.eventBus = new InMemoryEventBus();
    
    this.permissionRepository = new DrizzlePermissionRepository(this.transactionContext);
    this.tenantRoleRepository = new DrizzleTenantRoleRepository(this.transactionContext);
    this.roleAssignmentRepository = new DrizzleRoleAssignmentRepository(this.transactionContext);
    this.rolePermissionRepository = new DrizzleRolePermissionRepository(this.transactionContext);

    this.assignRoleUseCase = new AssignRoleUseCase(
      membershipRepository,
      this.tenantRoleRepository,
      this.roleAssignmentRepository,
      this.eventBus,
      this.unitOfWork
    );

    this.grantPermissionUseCase = new GrantPermissionUseCase(
      this.tenantRoleRepository,
      this.permissionRepository,
      this.rolePermissionRepository,
      this.eventBus,
      this.unitOfWork
    );

    this.revokePermissionUseCase = new RevokePermissionUseCase(
      this.rolePermissionRepository,
      this.eventBus,
      this.unitOfWork
    );

    this.checkPermissionUseCase = new CheckPermissionUseCase(
      membershipRepository,
      tenantRepository,
      userRepository,
      this.roleAssignmentRepository,
      this.rolePermissionRepository,
      this.permissionRepository
    );
  }
}

let authorizationContainerInstance: AuthorizationContainer | null = null;

export function createAuthorizationContainer(
  db: DrizzleDB,
  membershipRepository: IMembershipRepository,
  tenantRepository: ITenantRepository,
  userRepository: IUserRepository
): AuthorizationContainer {
  if (!authorizationContainerInstance) {
    authorizationContainerInstance = new AuthorizationContainer(db, membershipRepository, tenantRepository, userRepository);
  }
  return authorizationContainerInstance;
}

export const authorizationContainer = authorizationContainerInstance;
