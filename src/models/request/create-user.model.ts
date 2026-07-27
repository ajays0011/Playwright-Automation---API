/**
 * Create user request model.
 * Used for POST /Account/v1/User
 */
export interface CreateUserRequest {
  /** Username for the new account */
  userName: string;
  /** Password (must meet complexity requirements) */
  password: string;
}

/**
 * Factory for creating user registration payloads.
 */
export class CreateUserRequestFactory {
  /**
   * Create a valid user registration request.
   */
  static create(userName: string, password: string): CreateUserRequest {
    return { userName, password };
  }

  /**
   * Create request with weak password (missing uppercase).
   */
  static withWeakPassword(userName: string): CreateUserRequest {
    return { userName, password: 'weakpassword' };
  }

  /**
   * Create request with short password.
   */
  static withShortPassword(userName: string): CreateUserRequest {
    return { userName, password: 'Ab1!' };
  }

  /**
   * Create request with empty username.
   */
  static withEmptyUsername(): CreateUserRequest {
    return { userName: '', password: 'Test@12345' };
  }

  /**
   * Create request with null values for testing.
   */
  static withNullValues(): Record<string, null> {
    return { userName: null, password: null };
  }
}
