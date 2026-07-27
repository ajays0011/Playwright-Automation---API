import { test as base } from '@playwright/test';
import { ApiClient } from '../client/api-client';
import { TokenManager } from '../auth/token-manager';
import { AccountService } from '../services/account.service';
import { BookStoreService } from '../services/bookstore.service';
import { EnvConfig } from '../config/env.config';
import { DataProvider } from '../utils/data-provider';
import { registerCustomMatchers } from '../matchers/custom-matchers';
import { createLogger } from '../utils/logger';
import {
  generateUniqueUsername,
  generateStrongPassword,
} from '../utils/test-helpers';

const logger = createLogger('Fixtures');

/**
 * Test user data created during test setup.
 */
export interface TestUser {
  userId: string;
  userName: string;
  password: string;
}

/**
 * Custom fixture types for the API automation framework.
 */
export type ApiFixtures = {
  /** Pre-configured API client (without auth) */
  apiClient: ApiClient;
  /** API client with valid authentication token */
  authenticatedClient: ApiClient;
  /** Token manager instance */
  tokenManager: TokenManager;
  /** Account service instance */
  accountService: AccountService;
  /** BookStore service instance */
  bookstoreService: BookStoreService;
  /** Authenticated account service */
  authAccountService: AccountService;
  /** Authenticated bookstore service */
  authBookstoreService: BookStoreService;
  /** Data provider instance */
  dataProvider: DataProvider;
  /** Auto-created test user with cleanup */
  testUser: TestUser;
  /** Environment configuration */
  envConfig: EnvConfig;
};

/**
 * Extended Playwright test with custom API fixtures.
 *
 * Provides:
 * - Pre-configured API clients (unauthenticated and authenticated)
 * - Service layer instances
 * - Token management
 * - Auto-created test users with cleanup
 * - Data provider for test data loading
 * - Custom matchers registration
 *
 * @example
 * ```typescript
 * import { test, expect } from '../src/fixtures/api-fixtures';
 *
 * test('should get all books', async ({ authBookstoreService }) => {
 *   const response = await authBookstoreService.getAllBooks();
 *   expect(response).toHaveValidStatus(200);
 * });
 * ```
 */
export const test = base.extend<ApiFixtures>({
  /** Environment configuration */
  envConfig: async ({}, use) => {
    const config = EnvConfig.getInstance();
    await use(config);
  },

  /** Unauthenticated API client */
  apiClient: async ({ request }, use) => {
    // Register custom matchers
    registerCustomMatchers();

    const client = new ApiClient(request);
    logger.info('API Client created');
    await use(client);
  },

  /** Token manager */
  tokenManager: async ({ request }, use) => {
    const manager = new TokenManager(request);
    logger.info('Token Manager created');
    await use(manager);
  },

  /** Authenticated API client - uses testUser credentials */
  authenticatedClient: async ({ request, testUser }, use) => {
    // Register custom matchers
    registerCustomMatchers();

    const client = new ApiClient(request);
    const tokenManager = new TokenManager(request);

    // Use the test user's credentials for token generation
    tokenManager.setCredentials(testUser.userName, testUser.password);

    // Generate token
    try {
      const token = await tokenManager.getToken();
      client.setToken(token);
      client.setTokenRefreshCallback(tokenManager.getRefreshCallback());
      logger.info(`Authenticated API Client created with token for user: ${testUser.userName}`);
    } catch (error) {
      logger.warn(
        'Failed to generate token for authenticated client. Some tests may fail.',
        { error: String(error) }
      );
    }

    await use(client);
  },

  /** Unauthenticated Account Service */
  accountService: async ({ apiClient }, use) => {
    const service = new AccountService(apiClient);
    await use(service);
  },

  /** Unauthenticated BookStore Service */
  bookstoreService: async ({ apiClient }, use) => {
    const service = new BookStoreService(apiClient);
    await use(service);
  },

  /** Authenticated Account Service */
  authAccountService: async ({ authenticatedClient }, use) => {
    const service = new AccountService(authenticatedClient);
    await use(service);
  },

  /** Authenticated BookStore Service */
  authBookstoreService: async ({ authenticatedClient }, use) => {
    const service = new BookStoreService(authenticatedClient);
    await use(service);
  },

  /** Data provider */
  dataProvider: async ({}, use) => {
    const provider = new DataProvider();
    await use(provider);
    provider.clearCache();
  },

  /** Auto-created test user with automatic cleanup */
  testUser: async ({ request }, use) => {
    // Register custom matchers
    registerCustomMatchers();

    const client = new ApiClient(request);
    const accountService = new AccountService(client);
    const tokenManager = new TokenManager(request);

    // Generate unique credentials for this test/worker
    const userName = generateUniqueUsername();
    const password = generateStrongPassword();

    let testUser: TestUser;

    try {
      // Create user
      const result = await accountService.createUserAndGetId(
        userName,
        password
      );
      testUser = result;
      logger.info(`Test user created: ${testUser.userId} (${testUser.userName})`);

      // Generate token for the test user
      tokenManager.setCredentials(userName, password);
      const token = await tokenManager.getToken();
      client.setToken(token);
    } catch (error) {
      logger.error('Failed to create test user', error);
      throw error;
    }

    await use(testUser);

    // Cleanup: delete the test user
    try {
      // Ensure we have a valid token for cleanup
      tokenManager.setCredentials(userName, password);
      const token = await tokenManager.getToken();
      client.setToken(token);

      await accountService.deleteUser(testUser.userId);
      logger.info(`Test user cleaned up: ${testUser.userId}`);
    } catch (error) {
      logger.warn(`Failed to cleanup test user ${testUser.userId}`, {
        error: String(error),
      });
    }
  },
});

/** Re-export expect for convenience */
export { expect } from '@playwright/test';
