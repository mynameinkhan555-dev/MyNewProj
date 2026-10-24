import { Router } from 'express';
// TODO: Uncomment after presentation exports are fixed
// import { AuthorizationController } from '@workspace/access-control/presentation/index.js';
// import { AuthorizationMiddleware } from '@workspace/access-control/presentation/index.js';
// import { ValidationMiddleware } from '@workspace/platform/presentation/index.js';
import { authorizationContainer } from '../container/authorization-container.js';

const router = Router();
// TODO: Uncomment after presentation exports are fixed
// const authorizationController = new AuthorizationController(
//   authorizationContainer.getAssignRoleUseCase(),
//   authorizationContainer.getGrantPermissionUseCase(),
//   authorizationContainer.getRevokePermissionUseCase(),
//   authorizationContainer.getCheckPermissionUseCase()
// );

// Feature flag check
const USE_AUTHORIZATION = process.env.USE_AUTHORIZATION === 'true';

if (USE_AUTHORIZATION) {
  // TODO: Uncomment after presentation exports are fixed
  // Assign role
  // router.post(
  //   '/tenants/:tenantId/roles/assign',
  //   AuthorizationMiddleware.requirePermission('roles:assign'),
  //   ValidationMiddleware.validate,
  //   authorizationController.assignRole.bind(authorizationController)
  // );

  // Grant permission
  // router.post(
  //   '/tenants/:tenantId/roles/:roleId/permissions/grant',
  //   AuthorizationMiddleware.requirePermission('permissions:grant'),
  //   ValidationMiddleware.validate,
  //   authorizationController.grantPermission.bind(authorizationController)
  // );

  // Revoke permission
  // router.post(
  //   '/tenants/:tenantId/roles/:roleId/permissions/revoke',
  //   AuthorizationMiddleware.requirePermission('permissions:revoke'),
  //   ValidationMiddleware.validate,
  //   authorizationController.revokePermission.bind(authorizationController)
  // );

  // Check permission
  // router.get(
  //   '/tenants/:tenantId/users/:userId/permissions/:permission',
  //   AuthorizationMiddleware.requirePermission('permissions:check'),
  //   authorizationController.checkPermission.bind(authorizationController)
  // );
}

export default router;
