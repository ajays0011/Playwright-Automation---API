import { BookResponse } from './book.model';

/**
 * Books collection response model.
 * Response from GET /BookStore/v1/Books
 */
export interface BooksResponse {
  /** Array of books */
  books: BookResponse[];
}

/**
 * Type guard for valid books response.
 */
export function isValidBooksResponse(
  response: unknown
): response is BooksResponse {
  if (!response || typeof response !== 'object') return false;
  const obj = response as Record<string, unknown>;
  return Array.isArray(obj.books);
}
