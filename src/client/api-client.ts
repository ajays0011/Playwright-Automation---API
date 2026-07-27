import { APIRequestContext, APIResponse } from '@playwright/test';
import { createLogger, Logger, RequestLogData, ResponseLogData } from '../utils/logger';
import { HEADERS } from '../config/constants';
import { allure } from 'allure-playwright';

/**
 * API response wrapper that includes response time measurement.
 */
export interface ApiResponseWrapper {
  /** The raw Playwright API response */
  response: APIResponse;
  /** Response time in milliseconds */
  responseTime: number;
  /** Parsed JSON body (cached) */
  body: unknown;
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Record<string, string>;
}

/**
 * Request options for the API client.
 */
export interface RequestOptions {
  /** Request body payload */
  data?: unknown;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Query parameters */
  params?: Record<string, string | number | boolean>;
  /** Authorization token (overrides default) */
  token?: string;
  /** Whether to skip authentication header */
  skipAuth?: boolean;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Core API client that wraps Playwright's APIRequestContext.
 *
 * Features:
 * - Automatic header injection (Content-Type, Authorization)
 * - Request/response logging via centralized Logger
 * - Response time measurement
 * - Auto-retry with token refresh on 401
 * - Allure report attachment of request/response data
 *
 * @example
 * ```typescript
 * const client = new ApiClient(request);
 * client.setToken('Bearer xyz...');
 * const response = await client.get('/BookStore/v1/Books');
 * console.log(response.status); // 200
 * console.log(response.body);   // { books: [...] }
 * ```
 */
export class ApiClient {
  private readonly request: APIRequestContext;
  private readonly logger: Logger;
  private authToken: string | null = null;
  private tokenRefreshCallback: (() => Promise<string>) | null = null;

  constructor(request: APIRequestContext) {
    this.request = request;
    this.logger = createLogger('ApiClient');
  }

  /**
   * Set the authorization token for subsequent requests.
   */
  setToken(token: string): void {
    this.authToken = token;
    this.logger.debug(`Auth token set: ${token.substring(0, 20)}...`);
  }

  /**
   * Get the current authorization token.
   */
  getToken(): string | null {
    return this.authToken;
  }

  /**
   * Clear the stored authorization token.
   */
  clearToken(): void {
    this.authToken = null;
    this.logger.debug('Auth token cleared');
  }

  /**
   * Register a callback for automatic token refresh on 401 responses.
   */
  setTokenRefreshCallback(callback: () => Promise<string>): void {
    this.tokenRefreshCallback = callback;
  }

  /**
   * Send a GET request.
   */
  async get(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponseWrapper> {
    return this.sendRequest('GET', endpoint, options);
  }

  /**
   * Send a POST request.
   */
  async post(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponseWrapper> {
    return this.sendRequest('POST', endpoint, options);
  }

  /**
   * Send a PUT request.
   */
  async put(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponseWrapper> {
    return this.sendRequest('PUT', endpoint, options);
  }

  /**
   * Send a DELETE request.
   */
  async delete(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponseWrapper> {
    return this.sendRequest('DELETE', endpoint, options);
  }

  /**
   * Send a PATCH request.
   */
  async patch(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponseWrapper> {
    return this.sendRequest('PATCH', endpoint, options);
  }

  /**
   * Core request method that handles all HTTP methods.
   * Includes logging, timing, retry logic, and Allure reporting.
   */
  private async sendRequest(
    method: string,
    endpoint: string,
    options: RequestOptions,
    isRetry: boolean = false
  ): Promise<ApiResponseWrapper> {
    // Build headers
    const headers = this.buildHeaders(options);

    // Build query string for URL
    const url = this.buildUrl(endpoint, options.params);

    // Log request
    const requestLogData: RequestLogData = {
      method,
      url,
      headers,
      body: options.data,
      queryParams: options.params
        ? Object.fromEntries(
            Object.entries(options.params).map(([k, v]) => [k, String(v)])
          )
        : undefined,
    };
    this.logger.logRequest(requestLogData);

    // Measure response time
    const startTime = Date.now();

    // Send request using Playwright
    let response: APIResponse;
    try {
      const requestOpts: Record<string, unknown> = {
        headers,
        timeout: options.timeout,
      };

      if (options.data !== undefined) {
        requestOpts.data = options.data;
      }

      if (options.params) {
        requestOpts.params = options.params;
      }

      switch (method) {
        case 'GET':
          response = await this.request.get(url, requestOpts);
          break;
        case 'POST':
          response = await this.request.post(url, requestOpts);
          break;
        case 'PUT':
          response = await this.request.put(url, requestOpts);
          break;
        case 'DELETE':
          response = await this.request.delete(url, requestOpts);
          break;
        case 'PATCH':
          response = await this.request.patch(url, requestOpts);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
    } catch (error) {
      this.logger.error(`Request failed: ${method} ${url}`, error);
      throw error;
    }

    const responseTime = Date.now() - startTime;

    // Parse response body
    let body: unknown;
    try {
      const text = await response.text();
      body = text ? JSON.parse(text) : null;
    } catch {
      body = await response.text();
    }

    // Build response wrapper
    const responseWrapper: ApiResponseWrapper = {
      response,
      responseTime,
      body,
      status: response.status(),
      headers: Object.fromEntries(
        Object.entries(response.headers())
      ),
    };

    // Log response
    const responseLogData: ResponseLogData = {
      statusCode: responseWrapper.status,
      responseTime,
      headers: responseWrapper.headers,
      body: responseWrapper.body,
    };
    this.logger.logResponse(responseLogData);

    // Attach to Allure report
    await this.attachToAllure(method, endpoint, requestLogData, responseWrapper);

    // Handle 401 with auto-retry (token refresh)
    if (
      responseWrapper.status === 401 &&
      !isRetry &&
      this.tokenRefreshCallback &&
      !options.skipAuth
    ) {
      this.logger.warn('Received 401, attempting token refresh and retry...');
      try {
        const newToken = await this.tokenRefreshCallback();
        this.setToken(newToken);
        return this.sendRequest(method, endpoint, options, true);
      } catch (refreshError) {
        this.logger.error('Token refresh failed', refreshError);
        return responseWrapper;
      }
    }

    return responseWrapper;
  }

  /**
   * Build request headers with authentication and content type.
   */
  private buildHeaders(options: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      [HEADERS.CONTENT_TYPE]: HEADERS.APPLICATION_JSON,
      [HEADERS.ACCEPT]: HEADERS.APPLICATION_JSON,
    };

    // Add auth token
    if (!options.skipAuth) {
      const token = options.token || this.authToken;
      if (token) {
        headers[HEADERS.AUTHORIZATION] = `Bearer ${token}`;
      }
    }

    // Merge additional headers
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    return headers;
  }

  /**
   * Build URL with query parameters.
   */
  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean>
  ): string {
    if (!params || Object.keys(params).length === 0) {
      return endpoint;
    }
    // Playwright handles params via the `params` option, so we just return the endpoint
    return endpoint;
  }

  /**
   * Attach request/response data to Allure report.
   */
  private async attachToAllure(
    method: string,
    endpoint: string,
    requestData: RequestLogData,
    responseWrapper: ApiResponseWrapper
  ): Promise<void> {
    try {
      await allure.attachment(
        `Request: ${method} ${endpoint}`,
        JSON.stringify(
          {
            method: requestData.method,
            url: requestData.url,
            headers: requestData.headers,
            body: requestData.body,
          },
          null,
          2
        ),
        'application/json'
      );

      await allure.attachment(
        `Response: ${responseWrapper.status} (${responseWrapper.responseTime}ms)`,
        JSON.stringify(
          {
            statusCode: responseWrapper.status,
            responseTime: `${responseWrapper.responseTime}ms`,
            headers: responseWrapper.headers,
            body: responseWrapper.body,
          },
          null,
          2
        ),
        'application/json'
      );
    } catch {
      // Allure attachments may fail outside of test context - ignore silently
    }
  }
}
