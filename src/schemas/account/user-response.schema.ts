/**
 * JSON Schema for User Response.
 * Validates response from GET /Account/v1/User/{UUID} and POST /Account/v1/User
 */
export const userResponseSchema = {
  type: 'object',
  properties: {
    userId: {
      type: 'string',
      description: 'Unique user identifier (UUID)',
    },
    username: {
      type: 'string',
      description: 'Username',
    },
    books: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          isbn: { type: 'string' },
          title: { type: 'string' },
          subTitle: { type: 'string' },
          author: { type: 'string' },
          publish_date: { type: 'string' },
          publisher: { type: 'string' },
          pages: { type: 'integer', minimum: 0 },
          description: { type: 'string' },
          website: { type: 'string' },
        },
        required: ['isbn', 'title', 'author'],
      },
      description: 'Books assigned to user',
    },
  },
  required: ['userId', 'username', 'books'],
  additionalProperties: false,
};

/**
 * JSON Schema for Create User Response.
 * Used to validate POST /Account/v1/User response.
 */
export const createUserResponseSchema = {
  type: 'object',
  properties: {
    userID: {
      type: 'string',
      minLength: 1,
      description: 'Generated user ID (UUID format)',
    },
    username: {
      type: 'string',
      minLength: 1,
      description: 'Registered username',
    },
    books: {
      type: 'array',
      maxItems: 0,
      items: {},
      description: 'Empty books array for new user',
    },
  },
  required: ['userID', 'username', 'books'],
  additionalProperties: false,
};
