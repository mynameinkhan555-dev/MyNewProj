import { trace } from '@opentelemetry/api';

export function initializeTracing(): void {
  // Tracing initialization placeholder
  // Full OpenTelemetry SDK requires compatible versions
  // Using @opentelemetry/api for manual span creation
}

export async function createSpan(name: string, fn: () => Promise<any>): Promise<any> {
  try {
    const tracer = trace.getTracer('identity-platform-api');
    return await tracer.startActiveSpan(name, async (span) => {
      try {
        return await fn();
      } finally {
        span.end();
      }
    });
  } catch (error) {
    // If tracing is not initialized, just run the function
    return await fn();
  }
}
