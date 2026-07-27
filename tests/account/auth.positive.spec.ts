import { test, expect } from '../../src/fixtures/api-fixtures';
import { EnvConfig } from '../../src/config/env.config';
import { HTTP_STATUS } from '../../src/config/constants';
import {
  tokenResponseSchema,
  validTokenResponseSchema,
} from '../../src/schemas/account/token-response.schema';
import { authorizedResponseSchema } from '../../src/schemas/account/authorized-response.schema';
import {
  generateUniqueUsername,
  generateStrongPassword,
} from '../../src/utils/test-helpers';

const envConfig = EnvConfig.getInstance();

test.describe('Authentication API - Positive Tests', () => {
  /**
   * Tests for POST /Account/v1/GenerateToken
   */
  test.describe('Generate Token @smoke @sanity', () => {
    let userName: string;
    let password: string;

    test.beforeAll(async ({ request }) => {
      // Create a test user for token generation tests
      userName = generateUniqueUsername('auth_pos');
      password = generateStrongPassword();

      const response = await request.post('/Account/v1/User', {
        data: { userName, password },
      });
      expect(response.status()).toBe(HTTP_STATUS.CREATED);
    });

    test('should generate token with valid credentials @smoke', async ({
      accountService,
    }) => {
      const response = await accountService.generateToken({
        userName,
        password,
      });

      expect(response).toHaveValidStatus(HTTP_STATUS.OK);
      expect(response).toHaveValidToken();
    });

    test('should return token with correct schema @contract', async ({
      accountService,
    }) => {
      const response = await accountService.generateToken({
        userName,
        password,
      });

      expect(response).toHaveValidStatus(HTTP_STATUS.OK);
      expect(response).toMatchSchema(validTokenResponseSchema);
    });

    test('should return token fields with valid values @sanity', async ({
      accountService,
    }) => {
      const response = await accountService.generateToken({
        userName,
        password,
      });

      const body = response.body as Record<string, unknown>;

      expect(response).toHaveValidStatus(HTTP_STATUS.OK);
      expect(body.token).toBeTruthy();
      expect(typeof body.token).toBe('string');
      expect((body.token as string).length).toBeGreaterThan(0);
      expect(body.status).toBe('Success');
      expect(body.result).toBe('User authorized successfully.');
      expect(body.expires).toBeTruthy();
    });

    test('should return response within acceptable time @regression', async ({
      accountService,
    }) => {
      const response = await accountService.generateToken({
        userName,
        password,
      });

      expect(response).toHaveValidStatus(HTTP_STATUS.OK);
      expect(response).toHaveResponseTime(envConfig.responseTimeThreshold);
    });

    test('should return correct response headers @regression', async ({
      accountService,
    }) => {
      const response = await accountService.generateToken({
        userName,
        password,
      });

      // Soft assertions for headers
      expect.soft(response.headers['content-type']).toContain('application/json');
    });

    test('should return token with valid expiration date @regression', async ({
      accountService,
    }) => {
      const response = await accountService.generateToken({
        userName,
        password,
      });

      const body = response.body as Record<string, unknown>;
      const expiresDate = new Date(body.expires as string);
      const now = new Date();

      expect(expiresDate.getTime()).toBeGreaterThan(now.getTime());
    });
  });

  /**
   * Tests for POST /Account/v1/Authorized
   */
  test.describe('Authorization Check @smoke @sanity', () => {
    let userName: string;
    let password: string;

    test.beforeAll(async ({ request }) => {
      userName = generateUniqueUsername('auth_chk');
      password = generateStrongPassword();

      const response = await request.post('/Account/v1/User', {
        data: { userName, password },
      });
      expect(response.status()).toBe(HTTP_STATUS.CREATED);

      // Generate token so the user is considered "authorized" by the API
      const tokenResponse = await request.post('/Account/v1/GenerateToken', {
        data: { userName, password },
      });
      expect(tokenResponse.status()).toBe(HTTP_STATUS.OK);
    });

    test('should return true for valid authorized user @smoke', async ({
      accountService,
    }) => {
      const response = await accountService.authorize({
        userName,
        password,
      });

      expect(response).toHaveValidStatus(HTTP_STATUS.OK);
      expect(response.body).toBe(true);
    });

    test('should validate authorization response schema @contract', async ({
      accountService,
    }) => {
      const response = await accountService.authorize({
        userName,
        password,
      });

      expect(response).toHaveValidStatus(HTTP_STATUS.OK);
      expect(response).toMatchSchema(authorizedResponseSchema);
    });

    test('should return false for invalid credentials @regression', async ({
      accountService,
    }) => {
      const response = await accountService.authorize({
        userName: 'nonexistent_user_xyz_12345',
        password: 'WrongPass@123',
      });

      expect(response).toHaveValidStatus(HTTP_STATUS.NOT_FOUND);
    });

    test('should respond within acceptable time @regression', async ({
      accountService,
    }) => {
      const response = await accountService.authorize({
        userName,
        password,
      });

      expect(response).toHaveResponseTime(envConfig.responseTimeThreshold);
    });
  });
});
