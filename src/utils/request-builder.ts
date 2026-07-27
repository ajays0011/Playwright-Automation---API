/**
 * Fluent request builder for constructing API request options.
 *
 * @example
 * ```typescript
 * const options = new RequestBuilder()
 *   .setBody({ userName: 'test', password: 'Test@123' })
 *   .setHeader('X-Custom', 'value')
 *   .setQueryParam('ISBN', '978-123')
 *   .setTimeout(5000)
 *   .build();
 * ```
 */

import { RequestOptions } from '../client/api-client';

export class RequestBuilder {
  private options: RequestOptions = {};

  /**
   * Set the request body payload.
   */
  setBody(data: unknown): RequestBuilder {
    this.options.data = data;
    return this;
  }

  /**
   * Set a specific header.
   */
  setHeader(key: string, value: string): RequestBuilder {
    if (!this.options.headers) {
      this.options.headers = {};
    }
    this.options.headers[key] = value;
    return this;
  }

  /**
   * Set multiple headers at once.
   */
  setHeaders(headers: Record<string, string>): RequestBuilder {
    this.options.headers = { ...this.options.headers, ...headers };
    return this;
  }

  /**
   * Set a query parameter.
   */
  setQueryParam(key: string, value: string | number | boolean): RequestBuilder {
    if (!this.options.params) {
      this.options.params = {};
    }
    this.options.params[key] = value;
    return this;
  }

  /**
   * Set multiple query parameters.
   */
  setQueryParams(params: Record<string, string | number | boolean>): RequestBuilder {
    this.options.params = { ...this.options.params, ...params };
    return this;
  }

  /**
   * Set the authorization token.
   */
  setToken(token: string): RequestBuilder {
    this.options.token = token;
    return this;
  }

  /**
   * Skip authentication header.
   */
  skipAuth(): RequestBuilder {
    this.options.skipAuth = true;
    return this;
  }

  /**
   * Set request timeout in milliseconds.
   */
  setTimeout(timeoutMs: number): RequestBuilder {
    this.options.timeout = timeoutMs;
    return this;
  }

  /**
   * Build and return the request options.
   */
  build(): RequestOptions {
    return { ...this.options };
  }

  /**
   * Reset the builder to its initial state.
   */
  reset(): RequestBuilder {
    this.options = {};
    return this;
  }

  /**
   * Create a new builder from existing options.
   */
  static from(options: RequestOptions): RequestBuilder {
    const builder = new RequestBuilder();
    builder.options = { ...options };
    return builder;
  }
}
