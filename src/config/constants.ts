/**
 * Framework-wide constants and configuration values.
 * Centralizes all magic strings, paths, and default values.
 */

// ============================================
// API Path Constants
// ============================================
export const API_PATHS = {
  ACCOUNT: {
    AUTHORIZED: '/Account/v1/Authorized',
    GENERATE_TOKEN: '/Account/v1/GenerateToken',
    USER: '/Account/v1/User',
    USER_BY_ID: (userId: string) => `/Account/v1/User/${userId}`,
  },
  BOOKSTORE: {
    BOOKS: '/BookStore/v1/Books',
    BOOK: '/BookStore/v1/Book',
    BOOK_BY_ISBN: (isbn: string) => `/BookStore/v1/Books/${isbn}`,
  },
} as const;

// ============================================
// HTTP Status Codes
// ============================================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  NOT_ACCEPTABLE: 406,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// ============================================
// Error Messages (from API)
// ============================================
export const ERROR_MESSAGES = {
  USER_NOT_AUTHORIZED: 'User not authorized!',
  USER_NOT_FOUND: 'User not found!',
  USER_ALREADY_EXISTS: 'User exists!',
  ISBN_NOT_FOUND: 'ISBN supplied is not available in Books Collection!',
  BOOK_NOT_IN_COLLECTION:
    "ISBN supplied is not available in User's Collection!",
  INVALID_PASSWORD:
    "Passwords must have at least one non alphanumeric character, one digit ('0'-'9'), one uppercase ('A'-'Z'), one lowercase ('a'-'z'), one special character and Password must be eight characters or longer.",
  MISSING_USERNAME: 'UserName and Password required.',
  USER_ID_NOT_CORRECT: 'User Id not correct!',
} as const;

// ============================================
// Default Timeouts (milliseconds)
// ============================================
export const TIMEOUTS = {
  DEFAULT_REQUEST: 30_000,
  DEFAULT_RESPONSE_TIME: 5_000,
  TOKEN_REFRESH_RETRY: 3,
  RETRY_DELAY: 1_000,
} as const;

// ============================================
// HTTP Methods
// ============================================
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  OPTIONS: 'OPTIONS',
  HEAD: 'HEAD',
} as const;

// ============================================
// Headers
// ============================================
export const HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  ACCEPT: 'Accept',
  APPLICATION_JSON: 'application/json',
} as const;

// ============================================
// Test Tags
// ============================================
export const TAGS = {
  SMOKE: '@smoke',
  SANITY: '@sanity',
  REGRESSION: '@regression',
  INTEGRATION: '@integration',
  CONTRACT: '@contract',
  SECURITY: '@security',
  NEGATIVE: '@negative',
} as const;

// ============================================
// Log File Paths
// ============================================
export const LOG_PATHS = {
  API_LOG: 'logs/api.log',
  ERROR_LOG: 'logs/error.log',
  COMBINED_LOG: 'logs/combined.log',
} as const;
