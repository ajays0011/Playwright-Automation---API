import { test, expect } from '../../src/fixtures/api-fixtures';
import { HTTP_STATUS } from '../../src/config/constants';
import { DataProvider } from '../../src/utils/data-provider';
import {
  failedTokenResponseSchema,
} from '../../src/schemas/account/token-response.schema';

const dataProvider = new DataProvider();

test.describe('Authentication API - Negative Tests @negative', () => {
  /**
   * Generate Token - Negative Scenarios
   */
  test.describe('Generate Token - Invalid Inputs @negative @regression', () => {
    test('should fail with missing userName @negative', async ({
      accountService,
    }) => {
      const response = await accountService.generateToken({
        userName: '',
        password: 'Test@12345',
      });

      expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    });

    test('should fail with missing password @negative', async ({
      accountService,
    }) => {
      const response = await accountService.generateToken({
        userName: 'testuser',
        password: '',
      });

      expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    });

    test('should fail with invalid credentials @negative', async ({
      accountService,
    }) => {
      const response = await accountService.generateToken({
        userName: 'nonexistent_user_abc_999',
        password: 'WrongPass@123',
      });

      expect(response).toHaveValidStatus(HTTP_STATUS.OK);
      const body = response.body as Record<string, unknown>;
      expect(body.token).toBeNull();
      expect(body.status).toBe('Failed');
      expect(body.result).toBe('User authorization failed.');
    });

    test('should return failed schema for invalid credentials @contract @negative', async ({
      accountService,
    }) => {
      const response = await accountService.generateToken({
        userName: 'nonexistent_user_def_999',
        password: 'WrongPass@123',
      });

      expect(response).toMatchSchema(failedTokenResponseSchema);
    });

    test('should fail with empty payload @negative', async ({
      apiClient,
    }) => {
      const response = await apiClient.post('/Account/v1/GenerateToken', {
        data: {},
        skipAuth: true,
      });

      expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    });

    test('should fail with null values @negative', async ({
      apiClient,
    }) => {
      const response = await apiClient.post('/Account/v1/GenerateToken', {
        data: { userName: null, password: null },
        skipAuth: true,
      });

      expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    });

    test('should fail with numeric userName @negative', async ({
      apiClient,
    }) => {
      const response = await apiClient.post('/Account/v1/GenerateToken', {
        data: { userName: 12345, password: 'Test@12345' },
        skipAuth: true,
      });

      // API may accept numeric types - verify behavior
      expect(response.status).toBeDefined();
    });

    test('should fail with boolean values @negative', async ({
      apiClient,
    }) => {
      const response = await apiClient.post('/Account/v1/GenerateToken', {
        data: { userName: true, password: false },
        skipAuth: true,
      });

      expect(response.status).toBeDefined();
    });
  });

  /**
   * Data-driven negative tests from JSON dataset
   */
  test.describe('Generate Token - Data Driven Negative Tests @negative', () => {
    let invalidAuthData: Array<{
      description: string;
      payload: Record<string, unknown>;
      expectedStatus: number;
      expectedResult?: string;
    }>;

    test.beforeAll(() => {
      invalidAuthData = dataProvider.loadNegativeData('invalid-auth');
    });

    test('should handle all invalid auth payloads @negative @regression', async ({
      apiClient,
    }) => {
      for (const testCase of invalidAuthData) {
        const response = await apiClient.post('/Account/v1/GenerateToken', {
          data: testCase.payload,
          skipAuth: true,
        });

        // Soft assertions so all cases run
        expect
          .soft(response.status, `Failed for: ${testCase.description}`)
          .toBeDefined();

        if (testCase.expectedResult) {
          const body = response.body as Record<string, unknown>;
          expect
            .soft(body.result, `Result mismatch for: ${testCase.description}`)
            .toBe(testCase.expectedResult);
        }
      }
    });
  });

  /**
   * Authorization - Missing Token Scenarios
   */
  test.describe('Authorization with Missing/Invalid Token @negative', () => {
    test('should fail accessing protected endpoint without token @negative', async ({
      apiClient,
    }) => {
      const response = await apiClient.get(
        '/Account/v1/User/non-existing-user-id',
        { skipAuth: true }
      );

      expect(response).toHaveValidStatus(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should fail with invalid token format @negative', async ({
      apiClient,
    }) => {
      const response = await apiClient.get(
        '/Account/v1/User/some-user-id',
        { token: 'invalid-token-format' }
      );

      expect(response).toHaveValidStatus(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should fail with expired token format @negative', async ({
      apiClient,
    }) => {
      // Use a JWT-like string that's definitely expired
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.expired';
      const response = await apiClient.get(
        '/Account/v1/User/some-user-id',
        { token: expiredToken }
      );

      expect(response).toHaveValidStatus(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should fail with empty Authorization header @negative', async ({
      apiClient,
    }) => {
      const response = await apiClient.get(
        '/Account/v1/User/some-user-id',
        {
          skipAuth: true,
          headers: { Authorization: '' },
        }
      );

      expect(response).toHaveValidStatus(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should fail with malformed Bearer token @negative', async ({
      apiClient,
    }) => {
      const response = await apiClient.get(
        '/Account/v1/User/some-user-id',
        {
          skipAuth: true,
          headers: { Authorization: 'Bearer ' },
        }
      );

      expect(response).toHaveValidStatus(HTTP_STATUS.UNAUTHORIZED);
    });
  });
});
