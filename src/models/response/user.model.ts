import { BookResponse } from './book.model';

/**
 * User response model.
 * Response from GET /Account/v1/User/{UUID} and POST /Account/v1/User
 */
export interface UserResponse {
  /** Unique user ID (UUID format) */
  userID: string;
  /** Username */
  username: string;
  /** Collection of books assigned to the user */
  books: BookResponse[];
}

/**
 * Create user response model.
 * Response from POST /Account/v1/User
 */
export interface CreateUserResponse {
  /** Generated user ID */
  userID: string;
  /** Username */
  username: string;
  /** Collection of books (initially empty) */
  books: BookResponse[];
}

/**
 * Type guard for valid user response.
 */
export function isValidUserResponse(
  response: unknown
): response is UserResponse {
  if (!response || typeof response !== 'object') return false;
  const obj = response as Record<string, unknown>;
  return (
    typeof obj.userID === 'string' &&
    typeof obj.username === 'string' &&
    Array.isArray(obj.books)
  );
}
