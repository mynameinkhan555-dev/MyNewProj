export interface AppConfig {
  port: number;
  nodeEnv: string;
}

export function loadConfig(): AppConfig {
  const rawPort = process.env["PORT"];

  if (!rawPort) {
    throw new Error(
      "PORT environment variable is required but was not provided.",
    );
  }

  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  return {
    port,
    nodeEnv: process.env["NODE_ENV"] ?? "development",
  };
}
