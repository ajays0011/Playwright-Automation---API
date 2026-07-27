import { ApiClient, ApiResponseWrapper } from '../client/api-client';
import { API_PATHS } from '../config/constants';
import { LoginRequest } from '../models/request/login.model';
import { CreateUserRequest } from '../models/request/create-user.model';
import { RequestOptions } from '../client/api-client';
import { createLogger } from '../utils/logger';

const logger = createLogger('AccountService');

/**
 * Account Service Layer.
 * Encapsulates all Account API operations with clean method interfaces.
 *
 * @example
 * ```typescript
 * const accountService = new AccountService(apiClient);
 * const token = await accountService.generateToken({ userName: 'test', password: 'Test@123' });
 * const user = await accountService.getUser(userId);
 * ```
 */
export class AccountService {
  private readonly apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Check if user is authorized.
   * POST /Account/v1/Authorized
   */
  async authorize(
    credentials: LoginRequest,
    options: RequestOptions = {}
  ): Promise<ApiResponseWrapper> {
    logger.info(`Checking authorization for user: ${credentials.userName}`);
    return this.apiClient.post(API_PATHS.ACCOUNT.AUTHORIZED, {
      data: credentials,
      ...options,
    });
  }

  /**
   * Generate authentication token.
   * POST /Account/v1/GenerateToken
   */
  async generateToken(
    credentials: LoginRequest,
    options: RequestOptions = {}
  ): Promise<ApiResponseWrapper> {
    logger.info(`Generating token for user: ${credentials.userName}`);
    return this.apiClient.post(API_PATHS.ACCOUNT.GENERATE_TOKEN, {
      data: credentials,
      skipAuth: true,
      ...options,
    });
  }

  /**
   * Create/Register a new user.
   * POST /Account/v1/User
   */
  async createUser(
    userData: CreateUserRequest | Partial<CreateUserRequest> | Record<string, unknown>,
    options: RequestOptions = {}
  ): Promise<ApiResponseWrapper> {
    logger.info(`Creating user: ${(userData as CreateUserRequest).userName || 'unknown'}`);
    return this.apiClient.post(API_PATHS.ACCOUNT.USER, {
      data: userData,
      skipAuth: true,
      ...options,
    });
  }

  /**
   * Get user profile by user ID.
   * GET /Account/v1/User/{UUID}
   */
  async getUser(
    userId: string,
    options: RequestOptions = {}
  ): Promise<ApiResponseWrapper> {
    logger.info(`Getting user profile: ${userId}`);
    return this.apiClient.get(API_PATHS.ACCOUNT.USER_BY_ID(userId), options);
  }

  /**
   * Delete user account.
   * DELETE /Account/v1/User/{UUID}
   */
  async deleteUser(
    userId: string,
    options: RequestOptions = {}
  ): Promise<ApiResponseWrapper> {
    logger.info(`Deleting user: ${userId}`);
    return this.apiClient.delete(API_PATHS.ACCOUNT.USER_BY_ID(userId), options);
  }

  /**
   * Create user and return userId for test setup.
   * Combines create + extract userId in one call.
   */
  async createUserAndGetId(
    userName: string,
    password: string
  ): Promise<{ userId: string; userName: string; password: string }> {
    const response = await this.createUser({ userName, password });

    if (response.status !== 201) {
      throw new Error(
        `Failed to create user "${userName}": Status=${response.status}, Body=${JSON.stringify(response.body)}`
      );
    }

    const body = response.body as { userID: string; username: string };
    logger.info(`User created successfully: ${body.userID}`);

    return {
      userId: body.userID,
      userName,
      password,
    };
  }
}
