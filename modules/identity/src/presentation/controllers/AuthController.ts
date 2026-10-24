import { Request, Response } from 'express';
import { RegisterUserUseCase } from '@workspace/identity/application';
import { LoginUserUseCase } from '@workspace/identity/application';
import { LogoutUserUseCase } from '@workspace/identity/application';
import { VerifyEmailUseCase } from '@workspace/identity/application';
import { ChangePasswordUseCase } from '@workspace/identity/application';
import type { ApplicationError } from '@workspace/identity/application';

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly logoutUserUseCase: LogoutUserUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    const result = await this.registerUserUseCase.execute({ email, password });

    if (result.isErr()) {
      this.handleError(result.error, res);
      return;
    }

    res.status(201).json({
      success: true,
      data: result.value,
    });
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    const result = await this.loginUserUseCase.execute({ email, password });

    if (result.isErr()) {
      this.handleError(result.error, res);
      return;
    }

    res.status(200).json({
      success: true,
      data: result.value,
    });
  }

  async logout(req: Request, res: Response): Promise<void> {
    const { sessionId } = req.body;

    const result = await this.logoutUserUseCase.execute({ sessionId });

    if (result.isErr()) {
      this.handleError(result.error, res);
      return;
    }

    res.status(200).json({
      success: true,
      data: result.value,
    });
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    const { emailIdentityId, verificationToken } = req.body;

    const result = await this.verifyEmailUseCase.execute({
      emailIdentityId,
      verificationToken,
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

  async changePassword(req: Request, res: Response): Promise<void> {
    const { userId, oldPassword, newPassword } = req.body;

    const result = await this.changePasswordUseCase.execute({
      userId,
      oldPassword,
      newPassword,
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
