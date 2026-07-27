import dotenv from 'dotenv';
import path from 'path';

/**
 * Strongly-typed environment configuration interface.
 * All environment-specific values are accessed through this interface.
 */
export interface IEnvConfig {
  /** Current environment name (dev | qa | cert | prod) */
  environment: string;
  /** Base URL for API requests */
  baseUrl: string;
  /** Default API username */
  apiUsername: string;
  /** Default API password */
  apiPassword: string;
  /** Token expiry buffer in milliseconds */
  tokenExpiryBufferMs: number;
  /** Log level (debug | info | warn | error) */
  logLevel: string;
  /** Request timeout in milliseconds */
  requestTimeout: number;
  /** Response time threshold for validation */
  responseTimeThreshold: number;
  /** Maximum parallel workers */
  maxWorkers: number;
}

/**
 * Environment configuration singleton.
 * Loads the appropriate .env file based on the ENV environment variable.
 *
 * @example
 * ```typescript
 * const config = EnvConfig.getInstance();
 * console.log(config.baseUrl);
 * console.log(config.environment);
 * ```
 */
export class EnvConfig implements IEnvConfig {
  private static instance: EnvConfig | null = null;

  public readonly environment: string;
  public readonly baseUrl: string;
  public readonly apiUsername: string;
  public readonly apiPassword: string;
  public readonly tokenExpiryBufferMs: number;
  public readonly logLevel: string;
  public readonly requestTimeout: number;
  public readonly responseTimeThreshold: number;
  public readonly maxWorkers: number;

  private constructor() {
    // Determine current environment
    this.environment = (process.env.ENV || 'dev').toLowerCase();

    // Validate environment name
    const validEnvironments = ['dev', 'qa', 'cert', 'prod'];
    if (!validEnvironments.includes(this.environment)) {
      throw new Error(
        `Invalid environment: "${this.environment}". Valid options: ${validEnvironments.join(', ')}`
      );
    }

    // Load environment-specific .env file
    const envFilePath = path.resolve(
      process.cwd(),
      'env',
      `.env.${this.environment}`
    );
    const result = dotenv.config({ path: envFilePath });

    if (result.error) {
      console.warn(
        `Warning: Could not load env file at ${envFilePath}. Using defaults/process env.`
      );
    }

    // Map environment variables with defaults
    this.baseUrl = this.getRequiredEnv('BASE_URL');
    this.apiUsername = this.getEnvOrDefault('API_USERNAME', 'testuser');
    this.apiPassword = this.getEnvOrDefault('API_PASSWORD', 'Test@12345');
    this.tokenExpiryBufferMs = parseInt(
      this.getEnvOrDefault('TOKEN_EXPIRY_BUFFER_MS', '30000'),
      10
    );
    this.logLevel = this.getEnvOrDefault('LOG_LEVEL', 'info');
    this.requestTimeout = parseInt(
      this.getEnvOrDefault('REQUEST_TIMEOUT', '30000'),
      10
    );
    this.responseTimeThreshold = parseInt(
      this.getEnvOrDefault('RESPONSE_TIME_THRESHOLD', '5000'),
      10
    );
    this.maxWorkers = parseInt(
      this.getEnvOrDefault('MAX_WORKERS', '4'),
      10
    );
  }

  /**
   * Get singleton instance of EnvConfig.
   * Creates the instance on first call, returns cached instance on subsequent calls.
   */
  public static getInstance(): EnvConfig {
    if (!EnvConfig.instance) {
      EnvConfig.instance = new EnvConfig();
    }
    return EnvConfig.instance;
  }

  /**
   * Reset the singleton instance (useful for testing).
   */
  public static resetInstance(): void {
    EnvConfig.instance = null;
  }

  /**
   * Get a required environment variable. Throws if not found.
   */
  private getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(
        `Required environment variable "${key}" is not set for environment "${this.environment}"`
      );
    }
    return value;
  }

  /**
   * Get an environment variable with a default fallback.
   */
  private getEnvOrDefault(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }
}
