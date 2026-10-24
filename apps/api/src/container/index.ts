// TODO: IAM excluded temporarily due to platform export issues
// Legacy IAM exports will be restored after platform exports are fixed
// export {
//   createIamContainer,
//   type IamContainer,
//   type IamContainerOptions,
// } from './iam-container.js';
// export { createIamRouterFromContainer } from './controllers.js';

export { identityContainer } from './identity-container.js';
export { tenantContainer } from './tenant-container.js';
export { authorizationContainer } from './authorization-container.js';
