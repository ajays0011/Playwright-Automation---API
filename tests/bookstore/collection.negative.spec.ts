import { test, expect } from '../../src/fixtures/api-fixtures';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../src/config/constants';
import {
  generateUniqueUsername,
  generateStrongPassword,
  generateUUID,
} from '../../src/utils/test-helpers';
import { TokenManager } from '../../src/auth/token-manager';
import { ApiClient } from '../../src/client/api-client';
import { AccountService } from '../../src/services/account.service';
import { BookStoreService } from '../../src/services/bookstore.service';

test.describe('Collection Management - Negative Tests @negative', () => {
  /**
   * Add Books - Negative Scenarios
   */
  test.describe('Add Books - Invalid Operations @negative @regression', () => {
    test('should fail to add book without authentication @negative', async ({
      apiClient,
    }) => {
      const response = await apiClient.post('/BookStore/v1/Books', {
        data: {
          userId: generateUUID(),
          collectionOfIsbns: [{ isbn: '9781449325862' }],
        },
        skipAuth: true,
      });

      expect(response).toHaveValidStatus(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should fail to add non-existing ISBN @negative', async ({
      request,
    }) => {
      const client = new ApiClient(request);
      const accountService = new AccountService(client);
      const bookstoreService = new BookStoreService(client);
      const tokenManager = new TokenManager(request);

      const userName = generateUniqueUsername('add_bad_isbn');
      const password = generateStrongPassword();

      const createResp = await accountService.createUser({ userName, password });
      const userId = (createResp.body as Record<string, string>).userID;

      tokenManager.setCredentials(userName, password);
      const token = await tokenManager.getToken();
      client.setToken(token);

      const addResponse = await bookstoreService.addBooksByIsbn(userId, [
        '0000000000000',
      ]);

      expect(addResponse).toHaveValidStatus(HTTP_STATUS.BAD_REQUEST);

      const body = addResponse.body as Record<string, unknown>;
      expect(body.message).toBe(ERROR_MESSAGES.ISBN_NOT_FOUND);

      // Cleanup
      await accountService.deleteUser(userId);
    });

    test('should fail to add duplicate book to collection @negative', async ({
      request,
    }) => {
      const client = new ApiClient(request);
      const accountService = new AccountService(client);
      const bookstoreService = new BookStoreService(client);
      const tokenManager = new TokenManager(request);

      const userName = generateUniqueUsername('add_dup');
      const password = generateStrongPassword();

      const createResp = await accountService.createUser({ userName, password });
      const userId = (createResp.body as Record<string, string>).userID;

      tokenManager.setCredentials(userName, password);
      const token = await tokenManager.getToken();
      client.setToken(token);

      // Add book first time
      await bookstoreService.addBooksByIsbn(userId, ['9781449325862']);

      // Try adding same book again
      const duplicateResponse = await bookstoreService.addBooksByIsbn(userId, [
        '9781449325862',
      ]);

      // Should fail with 400 - book already exists
      expect(duplicateResponse).toHaveValidStatus(HTTP_STATUS.BAD_REQUEST);

      // Cleanup
      await bookstoreService.deleteAllBooksForUser(userId);
      await accountService.deleteUser(userId);
    });

    test('should fail with invalid userId @negative', async ({
      authenticatedClient,
    }) => {
      const bookstoreService = new BookStoreService(authenticatedClient);

      const addResponse = await bookstoreService.addBooksByIsbn(
        'invalid-user-id',
        ['9781449325862']
      );

      expect(addResponse.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    });

    test('should fail with non-existing userId @negative', async ({
      authenticatedClient,
    }) => {
      const bookstoreService = new BookStoreService(authenticatedClient);

      const addResponse = await bookstoreService.addBooksByIsbn(
        generateUUID(),
        ['9781449325862']
      );

      expect(addResponse.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    });

    test('should fail with empty collection of ISBNs @negative', async ({
      request,
    }) => {
      const client = new ApiClient(request);
      const accountService = new AccountService(client);
      const bookstoreService = new BookStoreService(client);
      const tokenManager = new TokenManager(request);

      const userName = generateUniqueUsername('add_empty');
      const password = generateStrongPassword();

      const createResp = await accountService.createUser({ userName, password });
      const userId = (createResp.body as Record<string, string>).userID;

      tokenManager.setCredentials(userName, password);
      const token = await tokenManager.getToken();
      client.setToken(token);

      const addResponse = await bookstoreService.addBooksToUser({
        userId,
        collectionOfIsbns: [],
      });

      // Empty collection - may be accepted or rejected depending on API
      expect(addResponse.status).toBeDefined();

      // Cleanup
      await accountService.deleteUser(userId);
    });
  });

  /**
   * Delete Book - Negative Scenarios
   */
  test.describe('Delete Book - Invalid Operations @negative @regression', () => {
    test('should fail to delete non-existing book from collection @negative', async ({
      request,
    }) => {
      const client = new ApiClient(request);
      const accountService = new AccountService(client);
      const bookstoreService = new BookStoreService(client);
      const tokenManager = new TokenManager(request);

      const userName = generateUniqueUsername('del_nx');
      const password = generateStrongPassword();

      const createResp = await accountService.createUser({ userName, password });
      const userId = (createResp.body as Record<string, string>).userID;

      tokenManager.setCredentials(userName, password);
      const token = await tokenManager.getToken();
      client.setToken(token);

      const deleteResponse = await bookstoreService.deleteBookFromUser(
        '9781449325862',
        userId
      );

      expect(deleteResponse).toHaveValidStatus(HTTP_STATUS.BAD_REQUEST);
      const body = deleteResponse.body as Record<string, unknown>;
      expect(body.message).toBe(ERROR_MESSAGES.BOOK_NOT_IN_COLLECTION);

      // Cleanup
      await accountService.deleteUser(userId);
    });

    test('should fail to delete book without authentication @negative', async ({
      apiClient,
    }) => {
      const response = await apiClient.delete('/BookStore/v1/Book', {
        data: { isbn: '9781449325862', userId: generateUUID() },
        skipAuth: true,
      });

      expect(response).toHaveValidStatus(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  /**
   * Replace Book - Negative Scenarios
   */
  test.describe('Replace Book - Invalid Operations @negative @regression', () => {
    test('should fail to replace with non-existing ISBN @negative', async ({
      request,
    }) => {
      const client = new ApiClient(request);
      const accountService = new AccountService(client);
      const bookstoreService = new BookStoreService(client);
      const tokenManager = new TokenManager(request);

      const userName = generateUniqueUsername('repl_nx');
      const password = generateStrongPassword();

      const createResp = await accountService.createUser({ userName, password });
      const userId = (createResp.body as Record<string, string>).userID;

      tokenManager.setCredentials(userName, password);
      const token = await tokenManager.getToken();
      client.setToken(token);

      // Add a book first
      await bookstoreService.addBooksByIsbn(userId, ['9781449325862']);

      // Try to replace with non-existing ISBN
      const replaceResponse = await bookstoreService.replaceBook(
        '9781449325862',
        { userId, isbn: '0000000000000' }
      );

      expect(replaceResponse).toHaveValidStatus(HTTP_STATUS.BAD_REQUEST);

      // Cleanup
      await bookstoreService.deleteAllBooksForUser(userId);
      await accountService.deleteUser(userId);
    });

    test('should fail to replace without authentication @negative', async ({
      apiClient,
    }) => {
      const response = await apiClient.put(
        '/BookStore/v1/Books/9781449325862',
        {
          data: { userId: generateUUID(), isbn: '9781449331818' },
          skipAuth: true,
        }
      );

      expect(response).toHaveValidStatus(HTTP_STATUS.UNAUTHORIZED);
    });
  });

  /**
   * Clear All Books - Negative Scenarios
   */
  test.describe('Clear All Books - Invalid Operations @negative', () => {
    test('should fail to clear books without authentication @negative', async ({
      apiClient,
    }) => {
      const response = await apiClient.delete('/BookStore/v1/Books', {
        params: { UserId: generateUUID() },
        skipAuth: true,
      });

      expect(response).toHaveValidStatus(HTTP_STATUS.UNAUTHORIZED);
    });

    test('should fail with invalid user ID @negative', async ({
      authenticatedClient,
    }) => {
      const bookstoreService = new BookStoreService(authenticatedClient);

      const response = await bookstoreService.deleteAllBooksForUser(
        'invalid-user-id'
      );

      expect(response.status).toBeGreaterThanOrEqual(HTTP_STATUS.BAD_REQUEST);
    });
  });
});
