/**
 * Token response model.
 * Response from POST /Account/v1/GenerateToken
 */
export interface TokenResponse {
  /** JWT token string */
  token: string | null;
  /** Token expiration datetime */
  expires: string;
  /** Token generation status */
  status: string;
  /** Result message */
  result: string;
}

/**
 * Type guard for valid token response.
 */
export function isValidTokenResponse(
  response: unknown
): response is TokenResponse {
  if (!response || typeof response !== 'object') return false;
  const obj = response as Record<string, unknown>;
  return (
    typeof obj.token === 'string' &&
    obj.token.length > 0 &&
    typeof obj.expires === 'string' &&
    typeof obj.status === 'string' &&
    typeof obj.result === 'string'
  );
}
