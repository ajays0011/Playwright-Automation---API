/**
 * Global type declarations for the API automation framework.
 * Extends Playwright Test's Matchers interface to support custom matchers
 * for API response validation.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

declare global {
  namespace PlaywrightTest {
    interface Matchers<R, T> {
      /** Assert HTTP status code matches expected value */
      toHaveValidStatus(expectedStatus: number): R;
      /** Assert response body matches JSON schema */
      toMatchSchema(schema: object): R;
      /** Assert response time is within threshold (ms) */
      toHaveResponseTime(maxTimeMs: number): R;
      /** Assert response contains a book with given ISBN */
      toContainBook(isbn: string): R;
      /** Assert response contains a valid authentication token */
      toHaveValidToken(): R;
    }
  }
}

export {};
