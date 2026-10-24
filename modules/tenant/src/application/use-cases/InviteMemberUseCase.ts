import type { Result } from '@workspace/kernel';
import { err, ok } from '@workspace/kernel';
import { Membership, MembershipStatus } from '../../domain/index.js';
import { MembershipId } from '../../domain/MembershipId.js';
import type { IMembershipRepository } from '../../domain/index.js';
import type { IEventBus } from '../../domain/events/IEventBus.js';
import type { IUnitOfWork } from '@workspace/platform/ports';
import type { ApplicationError } from '../errors/ApplicationError.js';
import {
  ValidationApplicationError,
  NotFoundApplicationError,
  InternalApplicationError,
} from '../errors/ApplicationError.js';

export interface InviteMemberInput {
  tenantId: string;
  email: string;
  roleId: string;
  invitedBy: string;
}

export interface InviteMemberOutput {
  invitationId: string;
}

export class InviteMemberUseCase {
  constructor(
    private readonly membershipRepository: IMembershipRepository,
    private readonly eventBus: IEventBus,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(
    input: InviteMemberInput
  ): Promise<Result<InviteMemberOutput, ApplicationError>> {
    // Validate input
    if (!input.tenantId || !input.email || !input.roleId || !input.invitedBy) {
      return err(new ValidationApplicationError('Tenant ID, email, role ID, and invited by are required'));
    }

    // Simplified: Create pending membership directly
    // In production, this would create an Invitation aggregate
    const now = new Date();
    const membership = Membership.reconstruct({
      id: crypto.randomUUID(),
      userId: 'pending_user', // Placeholder until invitation accepted
      tenantId: input.tenantId,
      status: MembershipStatus.ACTIVE,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Save in transaction
    await this.unitOfWork.execute(async () => {
      await this.membershipRepository.insert(membership);
    });

    // TODO: Publish InvitationCreated event

    return ok({
      invitationId: membership.id.value,
    });
  }
}
