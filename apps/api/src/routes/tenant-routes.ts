import { Router } from 'express';
import { TenantController } from '@workspace/tenant/presentation/index.js';
import { TenantContextMiddleware } from '@workspace/tenant/presentation/index.js';
import { tenantContainer } from '../container/tenant-container.js';

const router = Router();
const tenantController = new TenantController(
  tenantContainer.getCreateTenantUseCase(),
  tenantContainer.getInviteMemberUseCase(),
  tenantContainer.getAcceptInvitationUseCase(),
  tenantContainer.getAddMembershipUseCase(),
  tenantContainer.getListMembershipsUseCase(),
  tenantContainer.getSwitchTenantUseCase()
);

// Feature flag check
const USE_TENANT = process.env.USE_TENANT === 'true';

if (USE_TENANT) {
  // Create tenant
  router.post(
    '/tenants',
    tenantController.createTenant.bind(tenantController)
  );

  // Invite member
  router.post(
    '/tenants/:tenantId/invite',
    TenantContextMiddleware.requireTenantContext,
    tenantController.inviteMember.bind(tenantController)
  );

  // Accept invitation
  router.post(
    '/invitations/:invitationId/accept',
    tenantController.acceptInvitation.bind(tenantController)
  );

  // Add membership
  router.post(
    '/memberships',
    tenantController.addMembership.bind(tenantController)
  );

  // List memberships
  router.get(
    '/users/:userId/memberships',
    tenantController.listMemberships.bind(tenantController)
  );

  // Switch tenant
  router.post(
    '/tenants/switch',
    tenantController.switchTenant.bind(tenantController)
  );
}

export default router;
