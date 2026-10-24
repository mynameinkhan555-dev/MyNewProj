import { CreateTenantUseCase, InviteMemberUseCase, AcceptInvitationUseCase, AddMembershipUseCase, ListMembershipsUseCase, SwitchTenantUseCase } from '@workspace/tenant/application';
import { DrizzleMembershipRepository, DrizzleTenantRepository, DrizzleUserTenantMembershipRepository } from '@workspace/tenant/infrastructure/persistence/drizzle/repositories';
import type { IMembershipRepository, ITenantRepository, IUserTenantMembershipRepository } from '@workspace/tenant/domain/repositories';
import type { DrizzleDB } from '@workspace/platform-database';
import { DrizzleUnitOfWork } from '@workspace/platform-database/unitOfWork/DrizzleUnitOfWork';
import { TransactionContext } from '@workspace/platform-database/unitOfWork/TransactionContext';
import { InMemoryEventBus } from '@workspace/access-control/infrastructure/event-bus/InMemoryEventBus';

export class TenantContainer {
  readonly membershipRepository: IMembershipRepository;
  readonly tenantRepository: ITenantRepository;
  readonly userTenantMembershipRepository: IUserTenantMembershipRepository;
  readonly unitOfWork: DrizzleUnitOfWork;
  readonly transactionContext: TransactionContext;
  readonly eventBus: InMemoryEventBus;

  constructor(db: DrizzleDB) {
    this.unitOfWork = new DrizzleUnitOfWork(db);
    this.transactionContext = this.unitOfWork.getContext();
    this.eventBus = new InMemoryEventBus();
    this.membershipRepository = new DrizzleMembershipRepository(this.transactionContext);
    this.tenantRepository = new DrizzleTenantRepository(this.transactionContext);
    this.userTenantMembershipRepository = new DrizzleUserTenantMembershipRepository(this.transactionContext);
  }

  getCreateTenantUseCase() {
    return new CreateTenantUseCase(
      this.tenantRepository,
      this.membershipRepository,
      this.eventBus,
      this.unitOfWork
    );
  }

  getInviteMemberUseCase() {
    return new InviteMemberUseCase(
      this.membershipRepository,
      this.eventBus,
      this.unitOfWork
    );
  }

  getAcceptInvitationUseCase() {
    return new AcceptInvitationUseCase(
      this.membershipRepository,
      this.eventBus,
      this.unitOfWork
    );
  }

  getAddMembershipUseCase() {
    return new AddMembershipUseCase(
      this.userTenantMembershipRepository,
      this.eventBus,
      this.unitOfWork
    );
  }

  getListMembershipsUseCase() {
    return new ListMembershipsUseCase(
      this.userTenantMembershipRepository
    );
  }

  getSwitchTenantUseCase() {
    return new SwitchTenantUseCase(
      this.userTenantMembershipRepository
    );
  }
}

export const tenantContainer = new TenantContainer(null as any);
