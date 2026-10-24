import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { Tenant, TenantStatus, Membership, MembershipStatus } from '../../domain/index.js';
import { TenantId } from '../../domain/TenantId.js';
import { MembershipId } from '../../domain/MembershipId.js';
import type { ITenantRepository } from '../../domain/index.js';
import type { IMembershipRepository } from '../../domain/index.js';
import type { IEventBus } from '../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import type { ApplicationError } from '../errors/ApplicationError.js';
import {
  ValidationApplicationError,
  NotFoundApplicationError,
  InternalApplicationError,
} from '../errors/ApplicationError.js';

export interface CreateTenantInput {
  name: string;
  ownerUserId: string;
}

export interface CreateTenantOutput {
  tenantId: string;
  membershipId: string;
}

export class CreateTenantUseCase {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly eventBus: IEventBus,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(
    input: CreateTenantInput
  ): Promise<Result<CreateTenantOutput, ApplicationError>> {
    // Validate input
    if (!input.name || !input.ownerUserId) {
      return err(new ValidationApplicationError('Tenant name and owner user ID are required'));
    }

    if (input.name.length < 3) {
      return err(new ValidationApplicationError('Tenant name must be at least 3 characters'));
    }

    // Create tenant
    const now = new Date();
    const tenant = Tenant.reconstruct({
      id: crypto.randomUUID(),
      name: input.name,
      status: TenantStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });

    // Create owner membership
    const membership = Membership.reconstruct({
      id: crypto.randomUUID(),
      userId: input.ownerUserId,
      tenantId: tenant.id.value,
      status: MembershipStatus.ACTIVE,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Save in transaction
    await this.unitOfWork.execute(async () => {
      await this.tenantRepository.insert(tenant);
      await this.membershipRepository.insert(membership);
    });

    // TODO: Publish TenantCreated, MembershipCreated events

    return ok({
      tenantId: tenant.id.value,
      membershipId: membership.id.value,
    });
  }
}
