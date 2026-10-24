import { Router } from 'express';
import { AuthController } from '@workspace/identity/presentation/index.js';
import { AuthGuard } from '@workspace/identity/presentation/index.js';
import { identityContainer } from '../container/identity-container.js';

const router = Router();
const authController = new AuthController(
  identityContainer.getRegisterUserUseCase(),
  identityContainer.getLoginUserUseCase(),
  identityContainer.getLogoutUserUseCase(),
  identityContainer.getVerifyEmailUseCase(),
  identityContainer.getChangePasswordUseCase()
);

// Feature flag check
const USE_IDENTITY = process.env.USE_IDENTITY === 'true';

if (USE_IDENTITY) {
  // Register
  router.post(
    '/register',
    authController.register.bind(authController)
  );

  // Login
  router.post(
    '/login',
    authController.login.bind(authController)
  );

  // Logout
  router.post(
    '/logout',
    AuthGuard.authenticate,
    authController.logout.bind(authController)
  );

  // Verify email
  router.post(
    '/verify-email',
    authController.verifyEmail.bind(authController)
  );

  // Change password
  router.post(
    '/change-password',
    AuthGuard.authenticate,
    authController.changePassword.bind(authController)
  );
}

export default router;
