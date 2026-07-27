import { expect } from '@playwright/test';
import { ApiResponseWrapper } from '../client/api-client';
import { SchemaValidator } from '../schemas/schema-validator';

/**
 * Custom Playwright matchers for API testing.
 *
 * Extends Playwright's expect with domain-specific assertions.
 * Registered globally via fixtures.
 * Type declarations are in global.d.ts.
 *
 * Usage:
 * ```typescript
 * expect(response).toHaveValidStatus(200);
 * expect(response).toMatchSchema(bookSchema);
 * expect(response).toHaveResponseTime(5000);
 * expect(response).toContainBook('9781449325862');
 * expect(response).toHaveValidToken();
 * ```
 */

/**
 * Register all custom matchers with Playwright's expect.
 */
export function registerCustomMatchers(): void {
  expect.extend({
    /**
     * Assert that the response has the expected HTTP status code.
     *
     * @example expect(response).toHaveValidStatus(200);
     */
    toHaveValidStatus(
      received: ApiResponseWrapper,
      expectedStatus: number
    ) {
      const pass = received.status === expectedStatus;
      const message = pass
        ? () =>
            `Expected status NOT to be ${expectedStatus}, but received ${received.status}`
        : () =>
            `Expected status ${expectedStatus}, but received ${received.status}.\nResponse body: ${JSON.stringify(received.body, null, 2)}`;

      return { pass, message, name: 'toHaveValidStatus' };
    },

    /**
     * Assert that the response body matches the given JSON schema.
     *
     * @example expect(response).toMatchSchema(bookSchema);
     */
    toMatchSchema(received: ApiResponseWrapper, schema: object) {
      const validator = SchemaValidator.getInstance();
      const result = validator.validate(schema, received.body);

      const pass = result.isValid;
      const message = pass
        ? () => 'Response body matches the expected schema'
        : () =>
            `Response body does not match schema.\nValidation errors:\n${result.errors.map((e) => `  - ${e}`).join('\n')}\n\nReceived body:\n${JSON.stringify(received.body, null, 2)}`;

      return { pass, message, name: 'toMatchSchema' };
    },

    /**
     * Assert that the response time is within the specified threshold.
     *
     * @example expect(response).toHaveResponseTime(5000);
     */
    toHaveResponseTime(received: ApiResponseWrapper, maxTimeMs: number) {
      const pass = received.responseTime <= maxTimeMs;
      const message = pass
        ? () =>
            `Expected response time to exceed ${maxTimeMs}ms, but was ${received.responseTime}ms`
        : () =>
            `Expected response time ≤ ${maxTimeMs}ms, but was ${received.responseTime}ms`;

      return { pass, message, name: 'toHaveResponseTime' };
    },

    /**
     * Assert that the response body contains a book with the given ISBN.
     * Works with both single book and books array responses.
     *
     * @example expect(response).toContainBook('9781449325862');
     */
    toContainBook(received: ApiResponseWrapper, isbn: string) {
      const body = received.body as Record<string, unknown>;
      let found = false;

      if (body && typeof body === 'object') {
        // Check if it's a single book
        if ('isbn' in body && body.isbn === isbn) {
          found = true;
        }
        // Check if it's a books array
        if ('books' in body && Array.isArray(body.books)) {
          found = body.books.some(
            (book: Record<string, unknown>) => book.isbn === isbn
          );
        }
      }

      const pass = found;
      const message = pass
        ? () => `Expected response NOT to contain book with ISBN ${isbn}`
        : () =>
            `Expected response to contain book with ISBN ${isbn}, but it was not found.\nResponse body: ${JSON.stringify(body, null, 2)}`;

      return { pass, message, name: 'toContainBook' };
    },

    /**
     * Assert that the response contains a valid authentication token.
     *
     * @example expect(response).toHaveValidToken();
     */
    toHaveValidToken(received: ApiResponseWrapper) {
      const body = received.body as Record<string, unknown>;
      const hasToken =
        body &&
        typeof body === 'object' &&
        'token' in body &&
        typeof body.token === 'string' &&
        body.token.length > 0;

      const hasStatus =
        body &&
        typeof body === 'object' &&
        'status' in body &&
        body.status === 'Success';

      const pass = !!(hasToken && hasStatus);
      const message = pass
        ? () => 'Expected response NOT to have a valid token'
        : () =>
            `Expected response to have a valid token with status "Success".\nReceived: ${JSON.stringify(body, null, 2)}`;

      return { pass, message, name: 'toHaveValidToken' };
    },
  });
}
