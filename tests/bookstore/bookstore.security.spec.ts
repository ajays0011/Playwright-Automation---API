import { test, expect } from '../../src/fixtures/api-fixtures';
import { HTTP_STATUS } from '../../src/config/constants';
import { DataProvider } from '../../src/utils/data-provider';

const dataProvider = new DataProvider();

test.describe('BookStore API - Security Tests @security', () => {
  let securityPayloads: {
    sqlInjection: Array<{ description: string; payload: string }>;
    xss: Array<{ description: string; payload: string }>;
    unsupportedMethods: string[];
  };

  test.beforeAll(() => {
    securityPayloads = dataProvider.loadNegativeData('security-payloads');
  });

  /**
   * SQL Injection in ISBN parameter
   */
  test.describe('SQL Injection Prevention @security', () => {
    test('should reject SQL injection in ISBN query parameter @security', async ({
      bookstoreService,
    }) => {
      for (const injection of securityPayloads.sqlInjection) {
        const response = await bookstoreService.getBookByIsbn(
          injection.payload
        );

        // Should not return 200 with valid data
        expect
          .soft(
            response.status,
            `SQL injection not blocked in ISBN: ${injection.description}`
          )
          .toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);

        // Verify no SQL error messages leak
        const body = JSON.stringify(response.body || '');
        expect
          .soft(body.toLowerCase())
          .not.toContain('sql syntax');
        expect
          .soft(body.toLowerCase())
          .not.toContain('mysql');
      }
    });

    test('should reject SQL injection in book request body @security', async ({
      authenticatedClient,
    }) => {
      const { BookStoreService } = await import(
        '../../src/services/bookstore.service'
      );
      const bookstoreService = new BookStoreService(authenticatedClient);

      for (const injection of securityPayloads.sqlInjection) {
        const response = await bookstoreService.addBooksToUser({
          userId: injection.payload,
          collectionOfIsbns: [{ isbn: injection.payload }],
        });

        const body = JSON.stringify(response.body || '');
        expect
          .soft(body.toLowerCase(), `SQL error leaked: ${injection.description}`)
          .not.toContain('sql syntax');
      }
    });
  });

  /**
   * XSS Prevention
   */
  test.describe('XSS Prevention @security', () => {
    test('should not reflect XSS in ISBN responses @security', async ({
      bookstoreService,
    }) => {
      for (const xss of securityPayloads.xss) {
        const response = await bookstoreService.getBookByIsbn(xss.payload);

        const body = JSON.stringify(response.body || '');
        expect
          .soft(body, `XSS reflected: ${xss.description}`)
          .not.toContain('<script>');
      }
    });
  });

  /**
   * Unsupported HTTP Methods on BookStore endpoints
   */
  test.describe('Unsupported HTTP Methods @security', () => {
    test('should reject PATCH on /BookStore/v1/Books @security', async ({
      apiClient,
    }) => {
      const response = await apiClient.patch('/BookStore/v1/Books', {
        data: {},
        skipAuth: true,
      });

      expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    });

    test('should reject PUT on /BookStore/v1/Book @security', async ({
      apiClient,
    }) => {
      const response = await apiClient.put('/BookStore/v1/Book', {
        data: {},
        skipAuth: true,
      });

      expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    });

    test('should reject POST on /BookStore/v1/Book @security', async ({
      apiClient,
    }) => {
      const response = await apiClient.post('/BookStore/v1/Book', {
        data: {},
        skipAuth: true,
      });

      expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    });
  });

  /**
   * Rate Limiting and Abuse Prevention
   */
  test.describe('API Abuse Prevention @security', () => {
    test('should handle rapid consecutive requests @security', async ({
      bookstoreService,
    }) => {
      const requests = Array.from({ length: 10 }, () =>
        bookstoreService.getAllBooks()
      );

      const responses = await Promise.all(requests);

      for (const response of responses) {
        // All should either succeed or return rate limit
        expect
          .soft(response.status)
          .toBeLessThanOrEqual(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }
    });
  });
});
