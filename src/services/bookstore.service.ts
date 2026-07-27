import { ApiClient, ApiResponseWrapper } from '../client/api-client';
import { API_PATHS } from '../config/constants';
import { AddBooksRequest } from '../models/request/add-books.model';
import { ReplaceBookRequest } from '../models/request/replace-book.model';
import { RequestOptions } from '../client/api-client';
import { createLogger } from '../utils/logger';

const logger = createLogger('BookStoreService');

/**
 * BookStore Service Layer.
 * Encapsulates all BookStore API operations with clean method interfaces.
 *
 * @example
 * ```typescript
 * const bookStoreService = new BookStoreService(apiClient);
 * const allBooks = await bookStoreService.getAllBooks();
 * const book = await bookStoreService.getBookByIsbn('9781449325862');
 * await bookStoreService.addBooksToUser(userId, ['9781449325862']);
 * ```
 */
export class BookStoreService {
  private readonly apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get all available books.
   * GET /BookStore/v1/Books
   */
  async getAllBooks(
    options: RequestOptions = {}
  ): Promise<ApiResponseWrapper> {
    logger.info('Fetching all books');
    return this.apiClient.get(API_PATHS.BOOKSTORE.BOOKS, {
      skipAuth: true,
      ...options,
    });
  }

  /**
   * Get a single book by ISBN.
   * GET /BookStore/v1/Book?ISBN={isbn}
   */
  async getBookByIsbn(
    isbn: string,
    options: RequestOptions = {}
  ): Promise<ApiResponseWrapper> {
    logger.info(`Fetching book with ISBN: ${isbn}`);
    return this.apiClient.get(API_PATHS.BOOKSTORE.BOOK, {
      params: { ISBN: isbn },
      skipAuth: true,
      ...options,
    });
  }

  /**
   * Add books to a user's collection.
   * POST /BookStore/v1/Books
   */
  async addBooksToUser(
    request: AddBooksRequest | Partial<AddBooksRequest> | Record<string, unknown>,
    options: RequestOptions = {}
  ): Promise<ApiResponseWrapper> {
    logger.info(`Adding books to user collection`);
    return this.apiClient.post(API_PATHS.BOOKSTORE.BOOKS, {
      data: request,
      ...options,
    });
  }

  /**
   * Convenience method: Add books by userId and ISBN array.
   */
  async addBooksByIsbn(
    userId: string,
    isbns: string[],
    options: RequestOptions = {}
  ): Promise<ApiResponseWrapper> {
    const request: AddBooksRequest = {
      userId,
      collectionOfIsbns: isbns.map((isbn) => ({ isbn })),
    };
    return this.addBooksToUser(request, options);
  }

  /**
   * Delete all books from a user's collection.
   * DELETE /BookStore/v1/Books?UserId={userId}
   */
  async deleteAllBooksForUser(
    userId: string,
    options: RequestOptions = {}
  ): Promise<ApiResponseWrapper> {
    logger.info(`Deleting all books for user: ${userId}`);
    return this.apiClient.delete(API_PATHS.BOOKSTORE.BOOKS, {
      params: { UserId: userId },
      ...options,
    });
  }

  /**
   * Delete a specific book from a user's collection.
   * DELETE /BookStore/v1/Book
   */
  async deleteBookFromUser(
    isbn: string,
    userId: string,
    options: RequestOptions = {}
  ): Promise<ApiResponseWrapper> {
    logger.info(`Deleting book ${isbn} from user ${userId}`);
    return this.apiClient.delete(API_PATHS.BOOKSTORE.BOOK, {
      data: { isbn, userId },
      ...options,
    });
  }

  /**
   * Replace a book in a user's collection with another book.
   * PUT /BookStore/v1/Books/{ISBN}
   */
  async replaceBook(
    currentIsbn: string,
    replaceRequest: ReplaceBookRequest | Partial<ReplaceBookRequest>,
    options: RequestOptions = {}
  ): Promise<ApiResponseWrapper> {
    logger.info(`Replacing book ${currentIsbn} in collection`);
    return this.apiClient.put(API_PATHS.BOOKSTORE.BOOK_BY_ISBN(currentIsbn), {
      data: replaceRequest,
      ...options,
    });
  }

  /**
   * Get first available ISBN from the book store.
   * Useful for test setup.
   */
  async getFirstAvailableIsbn(): Promise<string> {
    const response = await this.getAllBooks();
    const books = (response.body as { books: Array<{ isbn: string }> }).books;
    if (!books || books.length === 0) {
      throw new Error('No books available in the book store');
    }
    return books[0].isbn;
  }

  /**
   * Get two distinct ISBNs for replace book tests.
   */
  async getTwoDistinctIsbns(): Promise<[string, string]> {
    const response = await this.getAllBooks();
    const books = (response.body as { books: Array<{ isbn: string }> }).books;
    if (!books || books.length < 2) {
      throw new Error('Need at least 2 books for replace test');
    }
    return [books[0].isbn, books[1].isbn];
  }
}
