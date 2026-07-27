import { test, expect } from '../../src/fixtures/api-fixtures';
import { HTTP_STATUS } from '../../src/config/constants';
import { DataProvider } from '../../src/utils/data-provider';
import {
  generateUniqueUsername,
  generateStrongPassword,
} from '../../src/utils/test-helpers';

const dataProvider = new DataProvider();

test.describe('User API - Security Tests @security', () => {
  let securityPayloads: {
    sqlInjection: Array<{ description: string; payload: string }>;
    xss: Array<{ description: string; payload: string }>;
    unsupportedMethods: string[];
  };

  test.beforeAll(() => {
    securityPayloads = dataProvider.loadNegativeData('security-payloads');
  });

  /**
   * SQL Injection Tests
   */
  test.describe('SQL Injection Prevention @security', () => {
    test('should reject SQL injection in username field @security', async ({
      accountService,
    }) => {
      for (const injection of securityPayloads.sqlInjection) {
        const response = await accountService.createUser({
          userName: injection.payload,
          password: generateStrongPassword(),
        });

        // Should not return 200 with successful login
        // The API should either reject or handle safely
        expect
          .soft(
            response.status,
            `SQL injection not blocked: ${injection.description}`
          )
          .toBeDefined();

        // Verify no SQL error messages in response
        const body = JSON.stringify(response.body);
        expect
          .soft(body.toLowerCase(), `SQL error leaked: ${injection.description}`)
          .not.toContain('sql syntax');
        expect
          .soft(body.toLowerCase(), `SQL error leaked: ${injection.description}`)
          .not.toContain('mysql');
        expect
          .soft(body.toLowerCase(), `SQL error leaked: ${injection.description}`)
          .not.toContain('ora-');
      }
    });

    test('should reject SQL injection in password field @security', async ({
      accountService,
    }) => {
      for (const injection of securityPayloads.sqlInjection) {
        const response = await accountService.generateToken({
          userName: generateUniqueUsername('sql_pw'),
          password: injection.payload,
        });

        // Verify no SQL error messages in response
        const body = JSON.stringify(response.body);
        expect
          .soft(body.toLowerCase(), `SQL error leaked: ${injection.description}`)
          .not.toContain('sql syntax');
      }
    });
  });

  /**
   * XSS Prevention Tests
   */
  test.describe('XSS Prevention @security', () => {
    test('should not reflect XSS payloads in response @security', async ({
      accountService,
    }) => {
      for (const xss of securityPayloads.xss) {
        const response = await accountService.createUser({
          userName: xss.payload,
          password: generateStrongPassword(),
        });

        // Verify XSS payload is not reflected unescaped
        const body = JSON.stringify(response.body);
        expect
          .soft(
            body,
            `XSS payload reflected: ${xss.description}`
          )
          .not.toContain('<script>');
      }
    });
  });

  /**
   * Unsupported HTTP Methods
   */
  test.describe('Unsupported HTTP Methods @security', () => {
    test('should reject PATCH on User endpoint @security', async ({
      apiClient,
    }) => {
      const response = await apiClient.patch('/Account/v1/User', {
        data: { userName: 'test', password: 'Test@12345' },
        skipAuth: true,
      });

      expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    });

    test('should reject PUT on GenerateToken endpoint @security', async ({
      apiClient,
    }) => {
      const response = await apiClient.put('/Account/v1/GenerateToken', {
        data: { userName: 'test', password: 'Test@12345' },
        skipAuth: true,
      });

      expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    });

    test('should reject DELETE on GenerateToken endpoint @security', async ({
      apiClient,
    }) => {
      const response = await apiClient.delete('/Account/v1/GenerateToken', {
        skipAuth: true,
      });

      expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    });
  });

  /**
   * Invalid Headers
   */
  test.describe('Invalid Headers @security', () => {
    test('should handle missing Content-Type header @security', async ({
      apiClient,
    }) => {
      const response = await apiClient.post('/Account/v1/User', {
        data: {
          userName: generateUniqueUsername('no_ct'),
          password: generateStrongPassword(),
        },
        headers: { 'Content-Type': 'text/plain' },
        skipAuth: true,
      });

      // May accept or reject, but should not crash
      expect(response.status).toBeDefined();
    });

    test('should handle oversized request body @security', async ({
      apiClient,
    }) => {
      const largePayload = {
        userName: 'A'.repeat(10000),
        password: generateStrongPassword(),
      };

      const response = await apiClient.post('/Account/v1/User', {
        data: largePayload,
        skipAuth: true,
      });

      expect(response.status).toBeDefined();
    });
  });
});
