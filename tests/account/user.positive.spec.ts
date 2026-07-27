import { test, expect } from '../../src/fixtures/api-fixtures';
import { HTTP_STATUS } from '../../src/config/constants';
import { EnvConfig } from '../../src/config/env.config';
import {
  userResponseSchema,
  createUserResponseSchema,
} from '../../src/schemas/account/user-response.schema';
import {
  generateUniqueUsername,
  generateStrongPassword,
} from '../../src/utils/test-helpers';

const envConfig = EnvConfig.getInstance();

test.describe('User API - Positive Tests', () => {
  /**
   * POST /Account/v1/User - Create User
   */
  test.describe('Create User @smoke @regression', () => {
    test('should create user with valid credentials @smoke', async ({
      accountService,
    }) => {
      const userName = generateUniqueUsername('create_pos');
      const password = generateStrongPassword();

      const response = await accountService.createUser({
        userName,
        password,
      });

      expect(response).toHaveValidStatus(HTTP_STATUS.CREATED);

      const body = response.body as Record<string, unknown>;
      expect(body.userID).toBeTruthy();
      expect(body.username).toBe(userName);
      expect(body.books).toEqual([]);
    });

    test('should validate create user response schema @contract', async ({
      accountService,
    }) => {
      const userName = generateUniqueUsername('create_schema');
      const password = generateStrongPassword();

      const response = await accountService.createUser({
        userName,
        password,
      });

      expect(response).toHaveValidStatus(HTTP_STATUS.CREATED);
      expect(response).toMatchSchema(createUserResponseSchema);
    });

    test('should return user with UUID format userID @regression', async ({
      accountService,
    }) => {
      const userName = generateUniqueUsername('create_uuid');
      const password = generateStrongPassword();

      const response = await accountService.createUser({
        userName,
        password,
      });

      const body = response.body as Record<string, unknown>;
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(body.userID).toMatch(uuidRegex);
    });

    test('should create user within acceptable time @regression', async ({
      accountService,
    }) => {
      const userName = generateUniqueUsername('create_time');
      const password = generateStrongPassword();

      const response = await accountService.createUser({
        userName,
        password,
      });

      expect(response).toHaveValidStatus(HTTP_STATUS.CREATED);
      expect(response).toHaveResponseTime(envConfig.responseTimeThreshold);
    });

    test('should return correct content-type header @regression', async ({
      accountService,
    }) => {
      const userName = generateUniqueUsername('create_headers');
      const password = generateStrongPassword();

      const response = await accountService.createUser({
        userName,
        password,
      });

      expect.soft(response.headers['content-type']).toContain('application/json');
    });
  });

  /**
   * GET /Account/v1/User/{UUID} - Get User
   */
  test.describe('Get User Profile @smoke @regression', () => {
    test('should get user profile with valid userId @smoke', async ({
      testUser,
      authAccountService,
    }) => {
      const response = await authAccountService.getUser(testUser.userId);

      expect(response).toHaveValidStatus(HTTP_STATUS.OK);

      const body = response.body as Record<string, unknown>;
      expect(body.userId).toBe(testUser.userId);
      expect(body.username).toBe(testUser.userName);
    });

    test('should validate get user response schema @contract', async ({
      testUser,
      authAccountService,
    }) => {
      const response = await authAccountService.getUser(testUser.userId);

      expect(response).toHaveValidStatus(HTTP_STATUS.OK);
      expect(response).toMatchSchema(userResponseSchema);
    });

    test('should return user with books array @regression', async ({
      testUser,
      authAccountService,
    }) => {
      const response = await authAccountService.getUser(testUser.userId);

      const body = response.body as Record<string, unknown>;
      expect(Array.isArray(body.books)).toBe(true);
    });

    test('should respond within acceptable time @regression', async ({
      testUser,
      authAccountService,
    }) => {
      const response = await authAccountService.getUser(testUser.userId);

      expect(response).toHaveResponseTime(envConfig.responseTimeThreshold);
    });
  });

  /**
   * DELETE /Account/v1/User/{UUID} - Delete User
   */
  test.describe('Delete User @regression', () => {
    test('should delete user successfully @regression', async ({
      request,
      accountService,
    }) => {
      // Create a user specifically for deletion
      const userName = generateUniqueUsername('delete_pos');
      const password = generateStrongPassword();

      const createResponse = await accountService.createUser({
        userName,
        password,
      });
      expect(createResponse).toHaveValidStatus(HTTP_STATUS.CREATED);

      const userId = (createResponse.body as Record<string, string>).userID;

      // Generate token for the created user
      const { TokenManager } = await import('../../src/auth/token-manager');
      const tokenManager = new TokenManager(request);
      tokenManager.setCredentials(userName, password);
      const token = await tokenManager.getToken();

      // Delete the user
      const deleteResponse = await accountService.deleteUser(userId, {
        token,
      });

      expect(deleteResponse.status).toBeLessThanOrEqual(
        HTTP_STATUS.NO_CONTENT
      );
    });

    test('should not find user after deletion @regression', async ({
      request,
      accountService,
    }) => {
      // Create user
      const userName = generateUniqueUsername('delete_verify');
      const password = generateStrongPassword();

      const createResponse = await accountService.createUser({
        userName,
        password,
      });
      const userId = (createResponse.body as Record<string, string>).userID;

      // Authenticate
      const { TokenManager } = await import('../../src/auth/token-manager');
      const tokenManager = new TokenManager(request);
      tokenManager.setCredentials(userName, password);
      const token = await tokenManager.getToken();

      // Delete
      await accountService.deleteUser(userId, { token });

      // Verify user no longer exists (trying to get will fail)
      const getResponse = await accountService.getUser(userId, { token });
      expect(getResponse).toHaveValidStatus(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  /**
   * Data consistency tests
   */
  test.describe('Data Consistency @regression', () => {
    test('should maintain data consistency between create and get @regression', async ({
      testUser,
      authAccountService,
    }) => {
      const response = await authAccountService.getUser(testUser.userId);

      expect(response).toHaveValidStatus(HTTP_STATUS.OK);

      const body = response.body as Record<string, unknown>;
      expect(body.userID).toBe(testUser.userId);
      expect(body.username).toBe(testUser.userName);
    });
  });
});
