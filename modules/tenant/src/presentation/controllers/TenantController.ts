import { Request, Response } from 'express';
import { CreateTenantUseCase, InviteMemberUseCase, AcceptInvitationUseCase, AddMembershipUseCase, ListMembershipsUseCase, SwitchTenantUseCase } from '@workspace/tenant/application';
import type { ApplicationError } from '@workspace/tenant/application';
import { MembershipRole } from '@workspace/tenant/domain';

export class TenantController {
  constructor(
    private readonly createTenantUseCase: CreateTenantUseCase,
    private readonly inviteMemberUseCase: InviteMemberUseCase,
    private readonly acceptInvitationUseCase: AcceptInvitationUseCase,
    private readonly addMembershipUseCase: AddMembershipUseCase,
    private readonly listMembershipsUseCase: ListMembershipsUseCase,
    private readonly switchTenantUseCase: SwitchTenantUseCase
  ) {}

  async createTenant(req: Request, res: Response): Promise<void> {
    const { name, ownerUserId } = req.body;

    const result = await this.createTenantUseCase.execute({ name, ownerUserId });

    if (result.isErr()) {
      this.handleError(result.error, res);
      return;
    }

    res.status(201).json({
      success: true,
      data: result.value,
    });
  }

  async inviteMember(req: Request, res: Response): Promise<void> {
    const { tenantId, email, roleId, invitedBy } = req.body;

    const result = await this.inviteMemberUseCase.execute({
      tenantId,
      email,
      roleId,
      invitedBy,
    });

    if (result.isErr()) {
      this.handleError(result.error, res);
      return;
    }

    res.status(201).json({
      success: true,
      data: result.value,
    });
  }

  async acceptInvitation(req: Request, res: Response): Promise<void> {
    const { invitationToken, userId } = req.body;

    const result = await this.acceptInvitationUseCase.execute({
      invitationToken,
      userId,
    });

    if (result.isErr()) {
      this.handleError(result.error, res);
      return;
    }

    res.status(200).json({
      success: true,
      data: result.value,
    });
  }

  async addMembership(req: Request, res: Response): Promise<void> {
    const { userId, tenantId, role } = req.body;

    const result = await this.addMembershipUseCase.execute({
      userId,
      tenantId,
      role: role || MembershipRole.MEMBER,
    });

    if (result.isErr()) {
      this.handleError(result.error, res);
      return;
    }

    res.status(201).json({
      success: true,
      data: result.value,
    });
  }

  async listMemberships(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const userIdStr = Array.isArray(userId) ? userId[0] : userId;

    const result = await this.listMembershipsUseCase.execute(userIdStr);

    if (result.isErr()) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: result.error.message,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.value,
    });
  }

  async switchTenant(req: Request, res: Response): Promise<void> {
    const { userId, tenantId } = req.body;

    const result = await this.switchTenantUseCase.execute({ userId, tenantId });

    if (result.isErr()) {
      this.handleError(result.error, res);
      return;
    }

    res.status(200).json({
      success: true,
      data: result.value,
    });
  }

  private handleError(error: ApplicationError, res: Response): void {
    const statusCode = this.getStatusCode(error);
    res.status(statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  private getStatusCode(error: ApplicationError): number {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return 400;
      case 'NOT_FOUND_ERROR':
        return 404;
      case 'UNAUTHORIZED_ERROR':
        return 401;
      case 'FORBIDDEN_ERROR':
        return 403;
      case 'CONFLICT_ERROR':
        return 409;
      default:
        return 500;
    }
  }
}
