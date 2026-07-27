import { APIRequestContext } from '@playwright/test';
import { createLogger, Logger } from '../utils/logger';
import { EnvConfig } from '../config/env.config';
import { API_PATHS } from '../config/constants';

/**
 * Token data structure stored by the TokenManager.
 */
interface TokenData {
  /** JWT token string */
  token: string;
  /** Token expiration timestamp */
  expires: string;
  /** Token status from API */
  status: string;
  /** Token result message */
  result: string;
  /** Timestamp when token was generated */
  generatedAt: number;
}

/**
 * Centralized Token Manager for authentication.
 *
 * Features:
 * - Generate token automatically via the API
 * - Store token centrally within a test worker
 * - Reuse token across requests
 * - Auto-refresh token on expiry
 * - Handle invalid/expired token scenarios
 * - Thread-safe for parallel execution (each worker gets its own instance)
 *
 * @example
 * ```typescript
 * const tokenManager = new TokenManager(request);
 * const token = await tokenManager.getToken();
 * // Token is cached and reused
 * const sameToken = await tokenManager.getToken();
 * // Force refresh
 * const newToken = await tokenManager.refreshToken();
 * ```
 */
export class TokenManager {
  private readonly logger: Logger;
  private readonly envConfig: EnvConfig;
  private tokenData: TokenData | null = null;
  private request: APIRequestContext;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<string> | null = null;
  private customCredentials: { userName: string; password: string } | null = null;

  constructor(request: APIRequestContext) {
    this.request = request;
    this.logger = createLogger('TokenManager');
    this.envConfig = EnvConfig.getInstance();
  }

  /**
   * Set custom credentials for token generation.
   * If not set, uses environment defaults.
   */
  setCredentials(userName: string, password: string): void {
    this.customCredentials = { userName, password };
    this.logger.debug(`Custom credentials set for user: ${userName}`);
  }

  /**
   * Get a valid token. Returns cached token if still valid,
   * or generates a new one if expired/missing.
   */
  async getToken(): Promise<string> {
    if (this.tokenData && !this.isTokenExpired()) {
      this.logger.debug('Returning cached token');
      return this.tokenData.token;
    }

    // If already refreshing, wait for the existing refresh to complete
    if (this.isRefreshing && this.refreshPromise) {
      this.logger.debug('Token refresh already in progress, waiting...');
      return this.refreshPromise;
    }

    return this.generateNewToken();
  }

  /**
   * Force a token refresh regardless of current token state.
   */
  async refreshToken(): Promise<string> {
    this.logger.info('Forcing token refresh');
    this.invalidateToken();
    return this.generateNewToken();
  }

  /**
   * Invalidate/clear the stored token.
   */
  invalidateToken(): void {
    this.tokenData = null;
    this.logger.debug('Token invalidated');
  }

  /**
   * Check if the current token is expired or about to expire.
   */
  isTokenExpired(): boolean {
    if (!this.tokenData) {
      return true;
    }

    const expiresAt = new Date(this.tokenData.expires).getTime();
    const now = Date.now();
    const bufferMs = this.envConfig.tokenExpiryBufferMs;

    const isExpired = now >= expiresAt - bufferMs;

    if (isExpired) {
      this.logger.debug(
        `Token expired or within buffer. Expires: ${this.tokenData.expires}, Now: ${new Date().toISOString()}`
      );
    }

    return isExpired;
  }

  /**
   * Check if a token has been generated and is currently stored.
   */
  hasToken(): boolean {
    return this.tokenData !== null;
  }

  /**
   * Get the token refresh callback for use with ApiClient.
   * Returns a function that the ApiClient can call to refresh the token.
   */
  getRefreshCallback(): () => Promise<string> {
    return () => this.refreshToken();
  }

  /**
   * Generate a new token from the API.
   */
  private async generateNewToken(): Promise<string> {
    this.isRefreshing = true;

    this.refreshPromise = this.performTokenGeneration();

    try {
      const token = await this.refreshPromise;
      return token;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual API call to generate a token.
   */
  private async performTokenGeneration(): Promise<string> {
    const credentials = this.customCredentials || {
      userName: this.envConfig.apiUsername,
      password: this.envConfig.apiPassword,
    };

    this.logger.info(
      `Generating token for user: ${credentials.userName} on ${this.envConfig.environment}`
    );

    try {
      const response = await this.request.post(API_PATHS.ACCOUNT.GENERATE_TOKEN, {
        data: credentials,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      const responseBody = await response.json();
      const statusCode = response.status();

      if (statusCode !== 200 || !responseBody.token) {
        const errorMsg = `Token generation failed: Status=${statusCode}, Body=${JSON.stringify(responseBody)}`;
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      this.tokenData = {
        token: responseBody.token,
        expires: responseBody.expires,
        status: responseBody.status,
        result: responseBody.result,
        generatedAt: Date.now(),
      };

      this.logger.info(
        `Token generated successfully. Expires: ${this.tokenData.expires}`
      );

      return this.tokenData.token;
    } catch (error) {
      this.logger.error('Token generation failed', error);
      throw error;
    }
  }
}
