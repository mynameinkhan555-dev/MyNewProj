/**
 * Platform Logger
 * Production logging abstraction using pino
 */

import pino from 'pino';

export enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void;
  child(context: Record<string, unknown>): Logger;
}

export interface LoggerOptions {
  level?: LogLevel;
  context?: Record<string, unknown>;
}

export function createLogger(name: string, options: LoggerOptions = {}): Logger {
  const level = options.level || LogLevel.Info;
  const baseContext = options.context || {};

  const pinoLogger = pino({
    name,
    level,
    formatters: {
      level: (label) => ({ level: label }),
    },
  }, pino.transport({
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  }));

  const logger: Logger = {
    debug(message: string, meta?: Record<string, unknown>) {
      pinoLogger.debug({ ...baseContext, ...meta }, message);
    },
    info(message: string, meta?: Record<string, unknown>) {
      pinoLogger.info({ ...baseContext, ...meta }, message);
    },
    warn(message: string, meta?: Record<string, unknown>) {
      pinoLogger.warn({ ...baseContext, ...meta }, message);
    },
    error(message: string, error?: Error | unknown, meta?: Record<string, unknown>) {
      const errorMeta = error instanceof Error
        ? { ...meta, error: { message: error.message, stack: error.stack } }
        : { ...meta, error };
      pinoLogger.error({ ...baseContext, ...errorMeta }, message);
    },
    child(context: Record<string, unknown>) {
      return createLogger(name, {
        level,
        context: { ...baseContext, ...context },
      });
    },
  };

  return logger;
}

export default createLogger;
