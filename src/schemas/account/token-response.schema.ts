/**
 * JSON Schema for Token Response.
 * Validates response from POST /Account/v1/GenerateToken
 */
export const tokenResponseSchema = {
  type: 'object',
  properties: {
    token: {
      type: ['string', 'null'],
      description: 'JWT authentication token',
    },
    expires: {
      type: 'string',
      description: 'Token expiration date-time',
    },
    status: {
      type: 'string',
      description: 'Token generation status',
    },
    result: {
      type: 'string',
      description: 'Result message',
    },
  },
  required: ['token', 'expires', 'status', 'result'],
  additionalProperties: false,
};

/**
 * JSON Schema for successful token response (with non-null token).
 */
export const validTokenResponseSchema = {
  type: 'object',
  properties: {
    token: {
      type: 'string',
      minLength: 1,
      description: 'JWT authentication token (must be non-empty)',
    },
    expires: {
      type: 'string',
      description: 'Token expiration date-time',
    },
    status: {
      type: 'string',
      enum: ['Success'],
      description: 'Must be "Success"',
    },
    result: {
      type: 'string',
      enum: ['User authorized successfully.'],
      description: 'Success message',
    },
  },
  required: ['token', 'expires', 'status', 'result'],
  additionalProperties: false,
};

/**
 * JSON Schema for failed token response.
 */
export const failedTokenResponseSchema = {
  type: 'object',
  properties: {
    token: {
      type: 'null',
    },
    expires: {
      type: 'string',
    },
    status: {
      type: 'string',
      enum: ['Failed'],
    },
    result: {
      type: 'string',
      enum: ['User authorization failed.'],
    },
  },
  required: ['token', 'expires', 'status', 'result'],
  additionalProperties: false,
};
