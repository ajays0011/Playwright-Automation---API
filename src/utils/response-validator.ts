import { ApiResponseWrapper } from '../client/api-client';
import { SchemaValidator } from '../schemas/schema-validator';
import { createLogger } from './logger';
import type { JSONSchemaType } from 'ajv';

const logger = createLogger('ResponseValidator');

/**
 * Response validation utility class.
 * Provides reusable validation methods for API responses.
 *
 * @example
 * ```typescript
 * ResponseValidator.validateStatus(response, 200);
 * ResponseValidator.validateResponseTime(response, 5000);
 * ResponseValidator.validateHeaders(response, { 'content-type': 'application/json' });
 * ```
 */
export class ResponseValidator {
  /**
   * Validate HTTP status code matches expected value.
   */
  static validateStatus(
    response: ApiResponseWrapper,
    expectedStatus: number
  ): { isValid: boolean; message: string } {
    const isValid = response.status === expectedStatus;
    const message = isValid
      ? `Status ${response.status} matches expected ${expectedStatus}`
      : `Expected status ${expectedStatus} but received ${response.status}`;

    if (!isValid) {
      logger.warn(message);
    }

    return { isValid, message };
  }

  /**
   * Validate response time is within threshold.
   */
  static validateResponseTime(
    response: ApiResponseWrapper,
    maxTimeMs: number
  ): { isValid: boolean; message: string; actual: number } {
    const isValid = response.responseTime <= maxTimeMs;
    const message = isValid
      ? `Response time ${response.responseTime}ms within ${maxTimeMs}ms threshold`
      : `Response time ${response.responseTime}ms exceeds ${maxTimeMs}ms threshold`;

    if (!isValid) {
      logger.warn(message);
    }

    return { isValid, message, actual: response.responseTime };
  }

  /**
   * Validate response headers contain expected values.
   */
  static validateHeaders(
    response: ApiResponseWrapper,
    expectedHeaders: Record<string, string>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [key, expectedValue] of Object.entries(expectedHeaders)) {
      const actualValue = response.headers[key.toLowerCase()];
      if (!actualValue) {
        errors.push(`Missing header: ${key}`);
      } else if (
        !actualValue.toLowerCase().includes(expectedValue.toLowerCase())
      ) {
        errors.push(
          `Header "${key}" expected to contain "${expectedValue}" but got "${actualValue}"`
        );
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate response body against a JSON schema using AJV.
   */
  static validateSchema<T>(
    response: ApiResponseWrapper,
    schema: JSONSchemaType<T> | object
  ): { isValid: boolean; errors: string[] } {
    const validator = SchemaValidator.getInstance();
    return validator.validate(schema, response.body);
  }

  /**
   * Validate that the response body is not empty.
   */
  static validateBodyNotEmpty(
    response: ApiResponseWrapper
  ): { isValid: boolean; message: string } {
    const isValid = response.body !== null && response.body !== undefined;
    const message = isValid
      ? 'Response body is present'
      : 'Response body is empty or null';
    return { isValid, message };
  }

  /**
   * Validate that response body contains specific field with expected value.
   */
  static validateField(
    response: ApiResponseWrapper,
    fieldPath: string,
    expectedValue: unknown
  ): { isValid: boolean; message: string; actual: unknown } {
    const actual = this.getNestedValue(response.body, fieldPath);
    const isValid = actual === expectedValue;
    const message = isValid
      ? `Field "${fieldPath}" equals expected value`
      : `Field "${fieldPath}" expected "${expectedValue}" but got "${actual}"`;
    return { isValid, message, actual };
  }

  /**
   * Validate that a field exists in the response body.
   */
  static validateFieldExists(
    response: ApiResponseWrapper,
    fieldPath: string
  ): { isValid: boolean; message: string } {
    const value = this.getNestedValue(response.body, fieldPath);
    const isValid = value !== undefined && value !== null;
    const message = isValid
      ? `Field "${fieldPath}" exists in response`
      : `Field "${fieldPath}" is missing from response`;
    return { isValid, message };
  }

  /**
   * Get nested value from an object using dot notation.
   * e.g., 'books[0].isbn' or 'user.name'
   */
  private static getNestedValue(obj: unknown, path: string): unknown {
    if (!obj || typeof obj !== 'object') return undefined;

    return path.split('.').reduce((current: unknown, key: string) => {
      if (current === undefined || current === null) return undefined;

      // Handle array index notation like 'books[0]'
      const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, prop, index] = arrayMatch;
        const arr = (current as Record<string, unknown>)[prop];
        if (Array.isArray(arr)) {
          return arr[parseInt(index, 10)];
        }
        return undefined;
      }

      return (current as Record<string, unknown>)[key];
    }, obj);
  }
}
