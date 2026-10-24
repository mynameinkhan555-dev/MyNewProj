// TODO: IAM excluded temporarily due to platform export issues
// Platform exports (MemoryCache, EmailService, EmailMessage, etc.) are missing
// This stub provides minimal interface to allow apps/api to typecheck
// Full IAM container will be restored after platform exports are fixed

export interface IamContainer {
  users: any;
  passwordService: any;
  tokenService: any;
  providerRegistry: any;
  authService: any;
  policyService: any;
  registerUser: any;
  loginUser: any;
  logoutUser: any;
  changePassword: any;
  setInitialPassword: any;
  assignRole: any;
  oauthLogin: any;
  linkSocialAccount: any;
  initiateOAuth: any;
  oauthStates: any;
  sendMagicLink: any;
  verifyMagicLink: any;
  magicLinkRateLimiter: any;
  magicLinkEventHandler: any;
  createPolicy: any;
  updatePolicy: any;
  deletePolicy: any;
  activatePolicy: any;
  deactivatePolicy: any;
  getUser: any;
  listUsers: any;
  checkPermission: any;
  listPolicies: any;
  getPolicy: any;
  listRoles: any;
  events: any;
  outboxDispatcher: any;
}

export interface IamContainerOptions {
  database: any;
  cache?: any;
  emailService?: any;
}

export async function createIamContainer(options: IamContainerOptions): Promise<IamContainer> {
  // TODO: Restore full IAM container after platform exports are fixed
  // For now, return a minimal stub that satisfies the interface
  return {
    users: null,
    passwordService: null,
    tokenService: null,
    providerRegistry: null,
    authService: null,
    policyService: null,
    registerUser: null,
    loginUser: null,
    logoutUser: null,
    changePassword: null,
    setInitialPassword: null,
    assignRole: null,
    oauthLogin: null,
    linkSocialAccount: null,
    initiateOAuth: null,
    oauthStates: null,
    sendMagicLink: null,
    verifyMagicLink: null,
    magicLinkRateLimiter: null,
    magicLinkEventHandler: null,
    createPolicy: null,
    updatePolicy: null,
    deletePolicy: null,
    activatePolicy: null,
    deactivatePolicy: null,
    getUser: null,
    listUsers: null,
    checkPermission: null,
    listPolicies: null,
    getPolicy: null,
    listRoles: null,
    events: null,
    outboxDispatcher: null,
  };
}
