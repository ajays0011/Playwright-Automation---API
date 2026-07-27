/**
 * Login/Authorization request model.
 * Used for POST /Account/v1/Authorized and POST /Account/v1/GenerateToken
 */
export interface LoginRequest {
  /** Username for authentication */
  userName: string;
  /** Password for authentication */
  password: string;
}

/**
 * Factory for creating login request payloads.
 */
export class LoginRequestFactory {
  /**
   * Create a valid login request.
   */
  static create(userName: string, password: string): LoginRequest {
    return { userName, password };
  }

  /**
   * Create a request with missing username.
   */
  static withMissingUsername(password: string): Partial<LoginRequest> {
    return { password };
  }

  /**
   * Create a request with missing password.
   */
  static withMissingPassword(userName: string): Partial<LoginRequest> {
    return { userName };
  }

  /**
   * Create an empty request.
   */
  static empty(): Record<string, never> {
    return {};
  }
}
