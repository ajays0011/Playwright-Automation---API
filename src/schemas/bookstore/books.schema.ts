import { bookSchema } from './book.schema';

/**
 * JSON Schema for Books Collection Response.
 * Validates response from GET /BookStore/v1/Books
 */
export const booksSchema = {
  type: 'object',
  properties: {
    books: {
      type: 'array',
      items: bookSchema,
      description: 'Array of book objects',
    },
  },
  required: ['books'],
  additionalProperties: false,
};

/**
 * JSON Schema for non-empty books response.
 */
export const nonEmptyBooksSchema = {
  type: 'object',
  properties: {
    books: {
      type: 'array',
      items: bookSchema,
      minItems: 1,
      description: 'Non-empty array of books',
    },
  },
  required: ['books'],
  additionalProperties: false,
};
