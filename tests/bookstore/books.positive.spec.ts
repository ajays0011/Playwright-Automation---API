import { test, expect } from '../../src/fixtures/api-fixtures';
import { HTTP_STATUS } from '../../src/config/constants';
import { EnvConfig } from '../../src/config/env.config';
import { booksSchema, nonEmptyBooksSchema } from '../../src/schemas/bookstore/books.schema';

const envConfig = EnvConfig.getInstance();

test.describe('Books API - Positive Tests', () => {
  /**
   * GET /BookStore/v1/Books - Get All Books
   */
  test.describe('Get All Books @smoke @sanity', () => {
    test('should return all books successfully @smoke', async ({
      bookstoreService,
    }) => {
      const response = await bookstoreService.getAllBooks();

      expect(response).toHaveValidStatus(HTTP_STATUS.OK);

      const body = response.body as { books: unknown[] };
      expect(body.books).toBeDefined();
      expect(Array.isArray(body.books)).toBe(true);
      expect(body.books.length).toBeGreaterThan(0);
    });

    test('should validate books response schema @contract', async ({
      bookstoreService,
    }) => {
      const response = await bookstoreService.getAllBooks();

      expect(response).toHaveValidStatus(HTTP_STATUS.OK);
      expect(response).toMatchSchema(nonEmptyBooksSchema);
    });

    test('should return books with all required fields @sanity', async ({
      bookstoreService,
    }) => {
      const response = await bookstoreService.getAllBooks();

      const body = response.body as {
        books: Array<Record<string, unknown>>;
      };

      for (const book of body.books) {
        expect.soft(book.isbn, 'isbn should exist').toBeTruthy();
        expect.soft(book.title, 'title should exist').toBeTruthy();
        expect.soft(book.author, 'author should exist').toBeTruthy();
        expect.soft(typeof book.pages, 'pages should be number').toBe('number');
        expect.soft(book.publisher, 'publisher should exist').toBeTruthy();
      }
    });

    test('should return known books @regression', async ({
      bookstoreService,
    }) => {
      const response = await bookstoreService.getAllBooks();

      // Verify some known books exist
      expect(response).toContainBook('9781449325862'); // Git Pocket Guide
      expect(response).toContainBook('9781449331818'); // Learning JavaScript Design Patterns
    });

    test('should respond within acceptable time @regression', async ({
      bookstoreService,
    }) => {
      const response = await bookstoreService.getAllBooks();

      expect(response).toHaveValidStatus(HTTP_STATUS.OK);
      expect(response).toHaveResponseTime(envConfig.responseTimeThreshold);
    });

    test('should return correct response headers @regression', async ({
      bookstoreService,
    }) => {
      const response = await bookstoreService.getAllBooks();

      expect.soft(response.headers['content-type']).toContain('application/json');
    });

    test('should return consistent book count @regression', async ({
      bookstoreService,
    }) => {
      // Make two requests and verify consistency
      const response1 = await bookstoreService.getAllBooks();
      const response2 = await bookstoreService.getAllBooks();

      const books1 = (response1.body as { books: unknown[] }).books;
      const books2 = (response2.body as { books: unknown[] }).books;

      expect(books1.length).toBe(books2.length);
    });

    test('should not require authentication @regression', async ({
      apiClient,
    }) => {
      const response = await apiClient.get('/BookStore/v1/Books', {
        skipAuth: true,
      });

      expect(response).toHaveValidStatus(HTTP_STATUS.OK);
    });
  });
});
