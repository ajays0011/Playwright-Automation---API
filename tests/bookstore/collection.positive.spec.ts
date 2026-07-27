import { test, expect } from '../../src/fixtures/api-fixtures';
import { HTTP_STATUS } from '../../src/config/constants';
import { EnvConfig } from '../../src/config/env.config';
import {
  generateUniqueUsername,
  generateStrongPassword,
} from '../../src/utils/test-helpers';
import { TokenManager } from '../../src/auth/token-manager';
import { ApiClient } from '../../src/client/api-client';
import { AccountService } from '../../src/services/account.service';
import { BookStoreService } from '../../src/services/bookstore.service';

const envConfig = EnvConfig.getInstance();

test.describe('Collection Management - Positive Tests', () => {
  /**
   * POST /BookStore/v1/Books - Add Books to Collection
   */
  test.describe('Add Books to Collection @integration @regression', () => {
    test('should add a single book to user collection @integration', async ({
      request,
    }) => {
      // Setup: create user and authenticate
      const client = new ApiClient(request);
      const accountService = new AccountService(client);
      const bookstoreService = new BookStoreService(client);
      const tokenManager = new TokenManager(request);

      const userName = generateUniqueUsername('add_book');
      const password = generateStrongPassword();

      // Create user
      const createResp = await accountService.createUser({ userName, password });
      expect(createResp).toHaveValidStatus(HTTP_STATUS.CREATED);
      const userId = (createResp.body as Record<string, string>).userID;

      // Get token
      tokenManager.setCredentials(userName, password);
      const token = await tokenManager.getToken();
      client.setToken(token);

      // Add book
      const addResponse = await bookstoreService.addBooksByIsbn(userId, [
        '9781449325862',
      ]);

      expect(addResponse).toHaveValidStatus(HTTP_STATUS.CREATED);

      // Verify: get user and check books
      const userResponse = await accountService.getUser(userId);
      expect(userResponse).toHaveValidStatus(HTTP_STATUS.OK);

      const userBody = userResponse.body as {
        books: Array<{ isbn: string }>;
      };
      expect(userBody.books.length).toBe(1);
      expect(userBody.books[0].isbn).toBe('9781449325862');

      // Cleanup
      await bookstoreService.deleteAllBooksForUser(userId);
      await accountService.deleteUser(userId);
    });

    test('should add multiple books to user collection @integration', async ({
      request,
    }) => {
      const client = new ApiClient(request);
      const accountService = new AccountService(client);
      const bookstoreService = new BookStoreService(client);
      const tokenManager = new TokenManager(request);

      const userName = generateUniqueUsername('add_multi');
      const password = generateStrongPassword();

      const createResp = await accountService.createUser({ userName, password });
      expect(createResp).toHaveValidStatus(HTTP_STATUS.CREATED);
      const userId = (createResp.body as Record<string, string>).userID;

      tokenManager.setCredentials(userName, password);
      const token = await tokenManager.getToken();
      client.setToken(token);

      const isbns = ['9781449325862', '9781449331818'];
      const addResponse = await bookstoreService.addBooksByIsbn(userId, isbns);

      expect(addResponse).toHaveValidStatus(HTTP_STATUS.CREATED);

      // Verify
      const userResponse = await accountService.getUser(userId);
      const userBody = userResponse.body as {
        books: Array<{ isbn: string }>;
      };
      expect(userBody.books.length).toBe(2);

      // Cleanup
      await bookstoreService.deleteAllBooksForUser(userId);
      await accountService.deleteUser(userId);
    });

    test('should add book within acceptable response time @regression', async ({
      request,
    }) => {
      const client = new ApiClient(request);
      const accountService = new AccountService(client);
      const bookstoreService = new BookStoreService(client);
      const tokenManager = new TokenManager(request);

      const userName = generateUniqueUsername('add_time');
      const password = generateStrongPassword();

      const createResp = await accountService.createUser({ userName, password });
      const userId = (createResp.body as Record<string, string>).userID;

      tokenManager.setCredentials(userName, password);
      const token = await tokenManager.getToken();
      client.setToken(token);

      const addResponse = await bookstoreService.addBooksByIsbn(userId, [
        '9781449325862',
      ]);

      expect(addResponse).toHaveResponseTime(envConfig.responseTimeThreshold);

      // Cleanup
      await bookstoreService.deleteAllBooksForUser(userId);
      await accountService.deleteUser(userId);
    });
  });

  /**
   * DELETE /BookStore/v1/Book - Remove Single Book
   */
  test.describe('Remove Book from Collection @integration @regression', () => {
    test('should remove a specific book from collection @integration', async ({
      request,
    }) => {
      const client = new ApiClient(request);
      const accountService = new AccountService(client);
      const bookstoreService = new BookStoreService(client);
      const tokenManager = new TokenManager(request);

      const userName = generateUniqueUsername('rm_book');
      const password = generateStrongPassword();

      const createResp = await accountService.createUser({ userName, password });
      const userId = (createResp.body as Record<string, string>).userID;

      tokenManager.setCredentials(userName, password);
      const token = await tokenManager.getToken();
      client.setToken(token);

      // Add book first
      await bookstoreService.addBooksByIsbn(userId, ['9781449325862']);

      // Delete the specific book
      const deleteResponse = await bookstoreService.deleteBookFromUser(
        '9781449325862',
        userId
      );

      expect(deleteResponse).toHaveValidStatus(HTTP_STATUS.NO_CONTENT);

      // Verify book is removed
      const userResponse = await accountService.getUser(userId);
      const userBody = userResponse.body as {
        books: Array<{ isbn: string }>;
      };
      expect(userBody.books.length).toBe(0);

      // Cleanup
      await accountService.deleteUser(userId);
    });
  });

  /**
   * DELETE /BookStore/v1/Books?UserId={userId} - Clear All Books
   */
  test.describe('Clear All Books @integration @regression', () => {
    test('should delete all books from user collection @integration', async ({
      request,
    }) => {
      const client = new ApiClient(request);
      const accountService = new AccountService(client);
      const bookstoreService = new BookStoreService(client);
      const tokenManager = new TokenManager(request);

      const userName = generateUniqueUsername('clear_all');
      const password = generateStrongPassword();

      const createResp = await accountService.createUser({ userName, password });
      const userId = (createResp.body as Record<string, string>).userID;

      tokenManager.setCredentials(userName, password);
      const token = await tokenManager.getToken();
      client.setToken(token);

      // Add multiple books
      await bookstoreService.addBooksByIsbn(userId, [
        '9781449325862',
        '9781449331818',
      ]);

      // Clear all
      const clearResponse =
        await bookstoreService.deleteAllBooksForUser(userId);

      expect(clearResponse).toHaveValidStatus(HTTP_STATUS.NO_CONTENT);

      // Verify all books are removed
      const userResponse = await accountService.getUser(userId);
      const userBody = userResponse.body as {
        books: Array<{ isbn: string }>;
      };
      expect(userBody.books.length).toBe(0);

      // Cleanup
      await accountService.deleteUser(userId);
    });
  });

  /**
   * PUT /BookStore/v1/Books/{ISBN} - Replace Book
   */
  test.describe('Replace Book in Collection @integration @regression', () => {
    test('should replace a book with another book @integration', async ({
      request,
    }) => {
      const client = new ApiClient(request);
      const accountService = new AccountService(client);
      const bookstoreService = new BookStoreService(client);
      const tokenManager = new TokenManager(request);

      const userName = generateUniqueUsername('replace_bk');
      const password = generateStrongPassword();

      const createResp = await accountService.createUser({ userName, password });
      const userId = (createResp.body as Record<string, string>).userID;

      tokenManager.setCredentials(userName, password);
      const token = await tokenManager.getToken();
      client.setToken(token);

      const originalIsbn = '9781449325862';
      const replacementIsbn = '9781449331818';

      // Add original book
      await bookstoreService.addBooksByIsbn(userId, [originalIsbn]);

      // Replace with new book
      const replaceResponse = await bookstoreService.replaceBook(
        originalIsbn,
        { userId, isbn: replacementIsbn }
      );

      expect(replaceResponse).toHaveValidStatus(HTTP_STATUS.OK);

      // Verify replacement
      const userResponse = await accountService.getUser(userId);
      const userBody = userResponse.body as {
        books: Array<{ isbn: string }>;
      };

      const hasReplacement = userBody.books.some(
        (b) => b.isbn === replacementIsbn
      );
      const hasOriginal = userBody.books.some(
        (b) => b.isbn === originalIsbn
      );

      expect(hasReplacement).toBe(true);
      expect(hasOriginal).toBe(false);

      // Cleanup
      await bookstoreService.deleteAllBooksForUser(userId);
      await accountService.deleteUser(userId);
    });
  });
});
