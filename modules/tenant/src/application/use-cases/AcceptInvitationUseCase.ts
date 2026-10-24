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

export interface AcceptInvitationInput {
  invitationToken: string;
  userId: string;
}

export interface AcceptInvitationOutput {
  membershipId: string;
}

export class AcceptInvitationUseCase {
  constructor(
    private readonly membershipRepository: IMembershipRepository,
    private readonly eventBus: IEventBus,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(
    input: AcceptInvitationInput
  ): Promise<Result<AcceptInvitationOutput, ApplicationError>> {
    // Validate input
    if (!input.invitationToken || !input.userId) {
      return err(new ValidationApplicationError('Invitation token and user ID are required'));
    }

    // Find pending membership by invitation token
    // For now, we'll simplify by finding by ID (token validation would be more sophisticated)
    const membership = await this.membershipRepository.findById(new MembershipId(input.invitationToken));
    if (!membership) {
      return err(new NotFoundApplicationError('Invitation not found or expired'));
    }

    if (membership.status !== MembershipStatus.ACTIVE) {
      return err(new ValidationApplicationError('Membership is not active'));
    }

    // Accept invitation: update user ID and status
    const now = new Date();
    const updatedMembership = Membership.reconstruct({
      id: membership.id.value,
      userId: input.userId,
      tenantId: membership.tenantId.value,
      status: MembershipStatus.ACTIVE,
      joinedAt: now,
      createdAt: membership.createdAt,
      updatedAt: now,
    });

    // Save in transaction
    await this.unitOfWork.execute(async () => {
      await this.membershipRepository.update(updatedMembership);
    });

    // TODO: Publish MembershipCreated event

    return ok({
      membershipId: updatedMembership.id.value,
    });
  }
}
