import {
  createLogger,
  type Logger,
} from '@workspace/platform-logger';
import {
  createPostgresDatabase,
  type PostgresDatabase,
} from '@workspace/platform-database';
import { IdentityContainer } from './container/identity-container.js';
import { TenantContainer } from './container/tenant-container.js';
import { createAuthorizationContainer } from './container/authorization-container.js';

export interface AppContainer {
  logger: Logger;
  database: PostgresDatabase;
  identityContainer: IdentityContainer;
  tenantContainer: TenantContainer;
  authorizationContainer: ReturnType<typeof createAuthorizationContainer>;
}

export interface ContainerOptions {
  databaseUrl: string;
}

export async function createContainer(options: ContainerOptions): Promise<AppContainer> {
  const logger = createLogger('api');
  const database = createPostgresDatabase(options.databaseUrl);

  // Initialize identity and tenant containers with real DB
  const identityContainer = new IdentityContainer(database.pool as any);
  const tenantContainer = new TenantContainer(database.pool as any);

  // Initialize authorization container with cross-module dependencies
  const authorizationContainer = createAuthorizationContainer(
    database.pool as any,
    tenantContainer.membershipRepository,
    tenantContainer.tenantRepository,
    identityContainer.userRepository
  );

  return {
    logger,
    database,
    identityContainer,
    tenantContainer,
    authorizationContainer,
  };
}
