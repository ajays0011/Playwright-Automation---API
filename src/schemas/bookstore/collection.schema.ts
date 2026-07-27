/**
 * JSON Schema for Collection operation responses.
 * Validates responses from POST, PUT, DELETE /BookStore/v1/Books
 */

/**
 * Schema for add books response.
 */
export const addBooksResponseSchema = {
  type: 'object',
  properties: {
    books: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          isbn: { type: 'string' },
        },
        required: ['isbn'],
      },
      description: 'List of added book ISBNs',
    },
  },
  required: ['books'],
};

/**
 * Schema for error response from collection endpoints.
 */
export const collectionErrorSchema = {
  type: 'object',
  properties: {
    code: {
      type: 'string',
      description: 'Error code',
    },
    message: {
      type: 'string',
      description: 'Error message',
    },
  },
  required: ['code', 'message'],
  additionalProperties: false,
};
