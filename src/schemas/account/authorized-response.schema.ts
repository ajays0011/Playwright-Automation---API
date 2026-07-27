/**
 * JSON Schema for Authorized Response.
 * Validates response from POST /Account/v1/Authorized
 *
 * The authorized endpoint returns a boolean indicating authorization status.
 */
export const authorizedResponseSchema = {
  type: 'boolean',
  description: 'Authorization status - true if user is authorized',
};

/**
 * JSON Schema for error response from Authorized endpoint.
 */
export const authorizedErrorResponseSchema = {
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
