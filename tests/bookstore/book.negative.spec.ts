import { test, expect } from '../../src/fixtures/api-fixtures';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../src/config/constants';

test.describe('Book API - Negative Tests (Single Book) @negative', () => {
  /**
   * GET /BookStore/v1/Book - Invalid ISBN Scenarios
   */
  test.describe('Get Book - Invalid ISBN @negative @regression', () => {
    test('should fail with non-existing ISBN @negative', async ({
      bookstoreService,
    }) => {
      const response = await bookstoreService.getBookByIsbn('0000000000000');

      expect(response).toHaveValidStatus(HTTP_STATUS.BAD_REQUEST);

      const body = response.body as Record<string, unknown>;
      expect(body.message).toBe(ERROR_MESSAGES.ISBN_NOT_FOUND);
    });

    test('should fail with invalid ISBN format @negative', async ({
      bookstoreService,
    }) => {
      const response = await bookstoreService.getBookByIsbn('invalid-isbn');

      expect(response).toHaveValidStatus(HTTP_STATUS.BAD_REQUEST);
    });

    test('should fail with empty ISBN @negative', async ({
      bookstoreService,
    }) => {
      const response = await bookstoreService.getBookByIsbn('');

      expect(response).toHaveValidStatus(HTTP_STATUS.BAD_REQUEST);
    });

    test('should fail without ISBN parameter @negative', async ({
      apiClient,
    }) => {
      const response = await apiClient.get('/BookStore/v1/Book', {
        skipAuth: true,
      });

      expect(response).toHaveValidStatus(HTTP_STATUS.BAD_REQUEST);
    });

    test('should fail with special characters in ISBN @negative', async ({
      bookstoreService,
    }) => {
      const response = await bookstoreService.getBookByIsbn(
        "'; DROP TABLE books;--"
      );

      expect(response).toHaveValidStatus(HTTP_STATUS.BAD_REQUEST);
    });

    test('should fail with very long ISBN @negative', async ({
      bookstoreService,
    }) => {
      const longIsbn = '9'.repeat(1000);
      const response = await bookstoreService.getBookByIsbn(longIsbn);

      expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    });

    test('should return error schema for invalid ISBN @contract @negative', async ({
      bookstoreService,
    }) => {
      const response = await bookstoreService.getBookByIsbn('0000000000000');

      const body = response.body as Record<string, unknown>;
      expect(body).toHaveProperty('code');
      expect(body).toHaveProperty('message');
    });
  });
});
