import { createLogger } from './logger';

const logger = createLogger('TestHelpers');

/**
 * Test helper utilities for common operations.
 * Provides functions for test data generation, unique IDs, and retry logic.
 */

/**
 * Generate a unique username for test isolation.
 * Each parallel worker gets its own unique username to prevent conflicts.
 *
 * @example
 * ```typescript
 * const username = generateUniqueUsername();
 * // Returns: 'testuser_a1b2c3d4'
 * ```
 */
export function generateUniqueUsername(prefix: string = 'testuser'): string {
  const uniqueId = generateShortId();
  const username = `${prefix}_${uniqueId}`;
  logger.debug(`Generated unique username: ${username}`);
  return username;
}

/**
 * Generate a password that meets the BookStore API requirements.
 *
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 */
export function generateStrongPassword(): string {
  const uniquePart = generateShortId();
  return `Test@${uniquePart}1A`;
}

/**
 * Generate a short unique identifier (8 characters).
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Generate a UUID v4 string.
 */
export function generateUUID(): string {
  // Simple UUID v4 implementation without external dependency
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    }
  );
}

/**
 * Retry an async operation with configurable attempts and delay.
 *
 * @example
 * ```typescript
 * const result = await retryOperation(
 *   () => apiClient.get('/endpoint'),
 *   { maxRetries: 3, delayMs: 1000 }
 * );
 * ```
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, shouldRetry } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const shouldRetryError = shouldRetry ? shouldRetry(error) : true;

      if (isLastAttempt || !shouldRetryError) {
        logger.error(`Operation failed after ${attempt} attempts`, error);
        throw error;
      }

      logger.warn(
        `Operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`
      );
      await sleep(delayMs);
    }
  }

  throw new Error('Unexpected: retry loop exited without returning or throwing');
}

/**
 * Sleep for a specified duration.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for a condition to become true within a timeout.
 *
 * @example
 * ```typescript
 * await waitForCondition(
 *   async () => (await getStatus()) === 'ready',
 *   { timeoutMs: 10000, pollIntervalMs: 500 }
 * );
 * ```
 */
export async function waitForCondition(
  condition: () => Promise<boolean> | boolean,
  options: {
    timeoutMs?: number;
    pollIntervalMs?: number;
    timeoutMessage?: string;
  } = {}
): Promise<void> {
  const {
    timeoutMs = 10_000,
    pollIntervalMs = 500,
    timeoutMessage = 'Condition not met within timeout',
  } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const result = await condition();
    if (result) {
      return;
    }
    await sleep(pollIntervalMs);
  }

  throw new Error(`${timeoutMessage} (waited ${timeoutMs}ms)`);
}

/**
 * Safely parse a JSON string, returning null on failure.
 */
export function safeJsonParse<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Deep clone an object (avoids shared state between tests).
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Get the current timestamp in ISO format.
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Extract error message from API response body.
 */
export function extractErrorMessage(body: unknown): string {
  if (!body || typeof body !== 'object') return 'Unknown error';
  const errorBody = body as Record<string, unknown>;
  return (
    (errorBody.message as string) ||
    (errorBody.Message as string) ||
    (errorBody.error as string) ||
    JSON.stringify(body)
  );
}
