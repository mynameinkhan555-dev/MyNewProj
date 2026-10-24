import type { Router } from 'express';
// TODO: IAM excluded temporarily due to platform export issues
// import { createAuthGuard, createIamRouter, RateLimiter } from '@workspace/iam';
// import type { IamContainer } from './iam-container.js';

export function createIamRouterFromContainer(_container: any): Router {
  // TODO: Restore when IAM is fixed
  // return createIamRouter({
  //   auth: {
  //     registerUser: container.registerUser,
  //     loginUser: container.loginUser,
  //     logoutUser: container.logoutUser,
  //     changePassword: container.changePassword,
  //     setInitialPassword: container.setInitialPassword,
  //     authService: container.authService,
  //     authGuard: createAuthGuard(container.tokenService),
  //     sendMagicLink: container.sendMagicLink,
  //     verifyMagicLink: container.verifyMagicLink,
  //     magicLinkRateLimiter: container.magicLinkRateLimiter ?? undefined,
  //   },
  //   getUser: container.getUser,
  //   listUsers: container.listUsers,
  //   assignRole: container.assignRole,
  //   checkPermission: container.checkPermission,
  //   listRoles: container.listRoles,
  //   oauth: {
  //     initiateOAuth: container.initiateOAuth,
  //     registry: container.providerRegistry,
  //     stateRepository: container.oauthStates,
  //     login: container.oauthLogin,
  //     link: container.linkSocialAccount,
  //   },
  //   policy: {
  //     createPolicy: container.createPolicy,
  //     updatePolicy: container.updatePolicy,
  //     deletePolicy: container.deletePolicy,
  //     activatePolicy: container.activatePolicy,
  //     deactivatePolicy: container.deactivatePolicy,
  //     listPolicies: container.listPolicies,
  //     getPolicy: container.getPolicy,
  //     service: container.policyService,
  //   },
  // });
  throw new Error('IAM router not available - TODO: fix platform exports');
}
