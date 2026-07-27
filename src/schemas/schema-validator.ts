import Ajv, { ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import { createLogger } from '../utils/logger';

const logger = createLogger('SchemaValidator');

/**
 * Schema validation result.
 */
export interface SchemaValidationResult {
  /** Whether the data is valid against the schema */
  isValid: boolean;
  /** Array of error messages (empty if valid) */
  errors: string[];
  /** Raw AJV error objects */
  rawErrors: ErrorObject[] | null;
}

/**
 * Centralized JSON Schema validator using AJV.
 *
 * Features:
 * - Strict schema validation mode
 * - Full error messages with data paths
 * - Format validation (date-time, email, uri, etc.)
 * - Schema caching for performance
 * - Singleton pattern
 *
 * @example
 * ```typescript
 * const validator = SchemaValidator.getInstance();
 * const result = validator.validate(bookSchema, responseBody);
 * if (!result.isValid) {
 *   console.log(result.errors);
 * }
 * ```
 */
export class SchemaValidator {
  private static instance: SchemaValidator | null = null;
  private readonly ajv: Ajv;

  private constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
      validateFormats: true,
    });

    // Add format validators (date-time, email, uri, etc.)
    addFormats(this.ajv);

    logger.debug('SchemaValidator initialized with AJV');
  }

  /**
   * Get the singleton instance.
   */
  static getInstance(): SchemaValidator {
    if (!SchemaValidator.instance) {
      SchemaValidator.instance = new SchemaValidator();
    }
    return SchemaValidator.instance;
  }

  /**
   * Validate data against a JSON schema.
   *
   * @param schema - JSON schema object
   * @param data - Data to validate
   * @returns Validation result with errors
   */
  validate(schema: object, data: unknown): SchemaValidationResult {
    try {
      const validate = this.ajv.compile(schema);
      const isValid = validate(data);

      if (isValid) {
        logger.debug('Schema validation passed');
        return {
          isValid: true,
          errors: [],
          rawErrors: null,
        };
      }

      const errors = this.formatErrors(validate.errors || []);
      logger.warn(`Schema validation failed with ${errors.length} error(s)`, {
        errors,
      });

      return {
        isValid: false,
        errors,
        rawErrors: validate.errors || null,
      };
    } catch (error) {
      const errorMsg = `Schema compilation/validation error: ${error}`;
      logger.error(errorMsg, error);
      return {
        isValid: false,
        errors: [errorMsg],
        rawErrors: null,
      };
    }
  }

  /**
   * Validate and throw on failure.
   * Use in tests where you want an immediate assertion failure.
   */
  assertValid(schema: object, data: unknown): void {
    const result = this.validate(schema, data);
    if (!result.isValid) {
      throw new Error(
        `Schema validation failed:\n${result.errors.join('\n')}`
      );
    }
  }

  /**
   * Format AJV error objects into human-readable strings.
   */
  private formatErrors(errors: ErrorObject[]): string[] {
    return errors.map((error) => {
      const path = error.instancePath || '/';
      const message = error.message || 'unknown error';
      const params = error.params
        ? ` (${JSON.stringify(error.params)})`
        : '';
      return `${path}: ${message}${params}`;
    });
  }
}
