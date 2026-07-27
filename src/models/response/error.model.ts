/**
 * Error response model.
 * Standard error response from all API endpoints.
 */
export interface ErrorResponse {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
}

/**
 * Type guard for error response.
 */
export function isErrorResponse(
  response: unknown
): response is ErrorResponse {
  if (!response || typeof response !== 'object') return false;
  const obj = response as Record<string, unknown>;
  return (
    typeof obj.code === 'string' &&
    typeof obj.message === 'string'
  );
}
