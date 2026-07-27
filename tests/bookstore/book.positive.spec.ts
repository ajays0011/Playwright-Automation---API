import { test, expect } from '../../src/fixtures/api-fixtures';
import { HTTP_STATUS } from '../../src/config/constants';
import { EnvConfig } from '../../src/config/env.config';
import { bookSchema } from '../../src/schemas/bookstore/book.schema';

const envConfig = EnvConfig.getInstance();

test.describe('Book API - Positive Tests (Single Book)', () => {
  /**
   * GET /BookStore/v1/Book?ISBN={isbn} - Get Book by ISBN
   */
  test.describe('Get Book by ISBN @smoke @sanity', () => {
    const KNOWN_ISBN = '9781449325862'; // Git Pocket Guide

    test('should return book with valid ISBN @smoke', async ({
      bookstoreService,
    }) => {
      const response = await bookstoreService.getBookByIsbn(KNOWN_ISBN);

      expect(response).toHaveValidStatus(HTTP_STATUS.OK);

      const body = response.body as Record<string, unknown>;
      expect(body.isbn).toBe(KNOWN_ISBN);
      expect(body.title).toBeTruthy();
      expect(body.author).toBeTruthy();
    });

    test('should validate book response schema @contract', async ({
      bookstoreService,
    }) => {
      const response = await bookstoreService.getBookByIsbn(KNOWN_ISBN);

      expect(response).toHaveValidStatus(HTTP_STATUS.OK);
      expect(response).toMatchSchema(bookSchema);
    });

    test('should return correct book details @sanity', async ({
      bookstoreService,
    }) => {
      const response = await bookstoreService.getBookByIsbn(KNOWN_ISBN);

      const body = response.body as Record<string, unknown>;
      expect(body.isbn).toBe(KNOWN_ISBN);
      expect(body.title).toBe('Git Pocket Guide');
      expect(body.author).toBe('Richard E. Silverman');
      expect(body.publisher).toBe("O'Reilly Media");
      expect(body.pages).toBe(234);
    });

    test('should return all expected book fields @regression', async ({
      bookstoreService,
    }) => {
      const response = await bookstoreService.getBookByIsbn(KNOWN_ISBN);

      const body = response.body as Record<string, unknown>;

      // Verify all fields exist
      expect.soft(body.isbn).toBeDefined();
      expect.soft(body.title).toBeDefined();
      expect.soft(body.subTitle).toBeDefined();
      expect.soft(body.author).toBeDefined();
      expect.soft(body.publish_date).toBeDefined();
      expect.soft(body.publisher).toBeDefined();
      expect.soft(body.pages).toBeDefined();
      expect.soft(body.description).toBeDefined();
      expect.soft(body.website).toBeDefined();
    });

    test('should respond within acceptable time @regression', async ({
      bookstoreService,
    }) => {
      const response = await bookstoreService.getBookByIsbn(KNOWN_ISBN);

      expect(response).toHaveResponseTime(envConfig.responseTimeThreshold);
    });

    test('should return correct headers @regression', async ({
      bookstoreService,
    }) => {
      const response = await bookstoreService.getBookByIsbn(KNOWN_ISBN);

      expect.soft(response.headers['content-type']).toContain('application/json');
    });

    test('should validate multiple known books @regression', async ({
      bookstoreService,
    }) => {
      const knownIsbns = [
        '9781449325862',
        '9781449331818',
        '9781593275846',
      ];

      for (const isbn of knownIsbns) {
        const response = await bookstoreService.getBookByIsbn(isbn);

        expect.soft(response.status, `ISBN ${isbn} should return 200`).toBe(
          HTTP_STATUS.OK
        );

        const body = response.body as Record<string, unknown>;
        expect.soft(body.isbn, `ISBN should match for ${isbn}`).toBe(isbn);
      }
    });

    test('should not require authentication @regression', async ({
      apiClient,
    }) => {
      const response = await apiClient.get('/BookStore/v1/Book', {
        params: { ISBN: KNOWN_ISBN },
        skipAuth: true,
      });

      expect(response).toHaveValidStatus(HTTP_STATUS.OK);
    });
  });
});
