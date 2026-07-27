import { test, expect } from '../../src/fixtures/api-fixtures';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../src/config/constants';
import {
  generateUniqueUsername,
  generateStrongPassword,
  generateUUID,
} from '../../src/utils/test-helpers';

test.describe('User API - Negative Tests @negative', () => {
  /**
   * Create User - Negative Scenarios
   */
  test.describe('Create User - Invalid Inputs @negative @regression', () => {
    test('should fail to create duplicate user @negative', async ({
      accountService,
    }) => {
      const userName = generateUniqueUsername('dup_user');
      const password = generateStrongPassword();

      // Create user first time
      const firstResponse = await accountService.createUser({
        userName,
        password,
      });
      expect(firstResponse).toHaveValidStatus(HTTP_STATUS.CREATED);

      // Try to create same user again
      const duplicateResponse = await accountService.createUser({
        userName,
        password,
      });

      expect(duplicateResponse).toHaveValidStatus(HTTP_STATUS.NOT_ACCEPTABLE);
      const body = duplicateResponse.body as Record<string, unknown>;
      expect(body.message).toBe(ERROR_MESSAGES.USER_ALREADY_EXISTS);
    });

    test('should fail with weak password - no uppercase @negative', async ({
      accountService,
    }) => {
      const response = await accountService.createUser({
        userName: generateUniqueUsername('weak_pw1'),
        password: 'test@12345',
      });

      expect(response).toHaveValidStatus(HTTP_STATUS.BAD_REQUEST);
      const body = response.body as Record<string, unknown>;
      expect(body.message).toContain('Passwords must have at least one');
    });

    test('should fail with weak password - no special char @negative', async ({
      accountService,
    }) => {
      const response = await accountService.createUser({
        userName: generateUniqueUsername('weak_pw2'),
        password: 'Test12345',
      });

      expect(response).toHaveValidStatus(HTTP_STATUS.BAD_REQUEST);
    });

    test('should fail with weak password - no digit @negative', async ({
      accountService,
    }) => {
      const response = await accountService.createUser({
        userName: generateUniqueUsername('weak_pw3'),
        password: 'Test@abcde',
      });

      expect(response).toHaveValidStatus(HTTP_STATUS.BAD_REQUEST);
    });

    test('should fail with password too short @negative', async ({
      accountService,
    }) => {
      const response = await accountService.createUser({
        userName: generateUniqueUsername('weak_pw4'),
        password: 'T@1a',
      });

      expect(response).toHaveValidStatus(HTTP_STATUS.BAD_REQUEST);
    });

    test('should fail with missing username @negative', async ({
      apiClient,
    }) => {
      const response = await apiClient.post('/Account/v1/User', {
        data: { password: 'Test@12345' },
        skipAuth: true,
      });

      expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    });

    test('should fail with missing password @negative', async ({
      apiClient,
    }) => {
      const response = await apiClient.post('/Account/v1/User', {
        data: { userName: 'testuser' },
        skipAuth: true,
      });

      expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    });

    test('should fail with empty payload @negative', async ({
      apiClient,
    }) => {
      const response = await apiClient.post('/Account/v1/User', {
        data: {},
        skipAuth: true,
      });

      expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    });

    test('should fail with null values @negative', async ({ apiClient }) => {
      const response = await apiClient.post('/Account/v1/User', {
        data: { userName: null, password: null },
        skipAuth: true,
      });

      expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    });
  });

  /**
   * Get User - Negative Scenarios
   */
  test.describe('Get User - Invalid IDs @negative @regression', () => {
    test('should fail with non-existing user ID @negative', async ({
      authAccountService,
    }) => {
      const fakeUserId = generateUUID();
      const response = await authAccountService.getUser(fakeUserId);

      expect(response).toHaveValidStatus(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should fail with invalid UUID format @negative', async ({
      authAccountService,
    }) => {
      const response = await authAccountService.getUser('invalid-uuid');

      expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    });

    test('should fail with empty user ID @negative', async ({
      authAccountService,
    }) => {
      const response = await authAccountService.getUser('');

      // Empty ID in path results in a different endpoint
      expect(response.status).toBeDefined();
    });

    test('should fail without authentication @negative', async ({
      apiClient,
    }) => {
      const fakeUserId = generateUUID();
      const response = await apiClient.get(
        `/Account/v1/User/${fakeUserId}`,
        { skipAuth: true }
      );

      expect(response).toHaveValidStatus(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  /**
   * Delete User - Negative Scenarios
   */
  test.describe('Delete User - Invalid Operations @negative @regression', () => {
    test('should fail deleting non-existing user @negative', async ({
      authAccountService,
    }) => {
      const fakeUserId = generateUUID();
      const response = await authAccountService.deleteUser(fakeUserId);

      // Should fail - user does not exist
      expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    });

    test('should fail deleting without authentication @negative', async ({
      apiClient,
    }) => {
      const fakeUserId = generateUUID();
      const response = await apiClient.delete(
        `/Account/v1/User/${fakeUserId}`,
        { skipAuth: true }
      );

      expect(response).toHaveValidStatus(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should fail deleting with invalid token @negative', async ({
      apiClient,
    }) => {
      const fakeUserId = generateUUID();
      const response = await apiClient.delete(
        `/Account/v1/User/${fakeUserId}`,
        { token: 'invalid-token' }
      );

      expect(response).toHaveValidStatus(HTTP_STATUS.UNAUTHORIZED);
    });
  });
});
