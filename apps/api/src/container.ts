import {
  createLogger,
  type Logger,
} from "@workspace/platform";
import { createIamContainer, createIamRouterFromContainer, type IamContainerOptions } from "./container/index.js";

export interface AppContainer {
  logger: Logger;
  iamRouter: ReturnType<typeof createIamRouterFromContainer>;
  iamContainer: Awaited<ReturnType<typeof createIamContainer>>;
}

export interface ContainerOptions extends IamContainerOptions {
  // Additional options can be added here for other modules
}

/**
 * Composition container: apps/api is the only place that wires modules together
 * behind HTTP routes. As modules (iam, billing, tenant, notification, audit,
 * ...) grow application services, instantiate and expose them here so the
 * presentation layer in routes.ts can consume them -- never the other way
 * around.
 */
export async function createContainer(options: ContainerOptions = {}): Promise<AppContainer> {
  const logger = createLogger("api");

  // Create IAM container with all its dependencies
  const iamContainer = await createIamContainer(options);

  // Create IAM router from container
  const iamRouter = createIamRouterFromContainer(iamContainer);

  return { logger, iamRouter, iamContainer };
}
