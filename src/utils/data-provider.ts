import fs from 'fs';
import path from 'path';
import { EnvConfig } from '../config/env.config';
import { createLogger } from './logger';

const logger = createLogger('DataProvider');

/**
 * Data-driven test data provider.
 *
 * Loads JSON test data from environment-specific directories.
 * Supports dynamic test generation and unique data per worker.
 *
 * Directory structure:
 * test-data/
 *   dev/users.json
 *   qa/users.json
 *   cert/users.json
 *   prod/users.json
 *   negative/invalid-auth.json
 *   common/isbns.json
 *
 * @example
 * ```typescript
 * const provider = new DataProvider();
 * const users = provider.loadEnvData<UserData[]>('users');
 * const payloads = provider.loadNegativeData<Payload[]>('invalid-auth');
 * const isbns = provider.loadCommonData<string[]>('isbns');
 * ```
 */
export class DataProvider {
  private readonly envConfig: EnvConfig;
  private readonly testDataDir: string;
  private readonly cache: Map<string, unknown>;

  constructor() {
    this.envConfig = EnvConfig.getInstance();
    this.testDataDir = path.resolve(process.cwd(), 'test-data');
    this.cache = new Map();
  }

  /**
   * Load environment-specific test data.
   * Looks in test-data/{env}/{fileName}.json
   */
  loadEnvData<T>(fileName: string): T {
    const filePath = path.join(
      this.testDataDir,
      this.envConfig.environment,
      `${fileName}.json`
    );
    return this.loadJsonFile<T>(filePath);
  }

  /**
   * Load negative test data (shared across environments).
   * Looks in test-data/negative/{fileName}.json
   */
  loadNegativeData<T>(fileName: string): T {
    const filePath = path.join(
      this.testDataDir,
      'negative',
      `${fileName}.json`
    );
    return this.loadJsonFile<T>(filePath);
  }

  /**
   * Load common test data (shared across environments).
   * Looks in test-data/common/{fileName}.json
   */
  loadCommonData<T>(fileName: string): T {
    const filePath = path.join(
      this.testDataDir,
      'common',
      `${fileName}.json`
    );
    return this.loadJsonFile<T>(filePath);
  }

  /**
   * Load and return data for data-driven test generation.
   * Each item in the array becomes a separate test case.
   *
   * @example
   * ```typescript
   * const testCases = provider.getTestCases<TestCase>('invalid-auth');
   * for (const testCase of testCases) {
   *   test(`should fail with ${testCase.description}`, async () => { ... });
   * }
   * ```
   */
  getTestCases<T extends { description?: string }>(
    fileName: string,
    source: 'env' | 'negative' | 'common' = 'negative'
  ): T[] {
    switch (source) {
      case 'env':
        return this.loadEnvData<T[]>(fileName);
      case 'negative':
        return this.loadNegativeData<T[]>(fileName);
      case 'common':
        return this.loadCommonData<T[]>(fileName);
    }
  }

  /**
   * Load a JSON file and return parsed data.
   * Results are cached to avoid repeated disk reads.
   */
  private loadJsonFile<T>(filePath: string): T {
    // Check cache first
    if (this.cache.has(filePath)) {
      logger.debug(`Returning cached data for: ${filePath}`);
      return this.cache.get(filePath) as T;
    }

    if (!fs.existsSync(filePath)) {
      const errorMsg = `Test data file not found: ${filePath}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent) as T;
      this.cache.set(filePath, data);
      logger.debug(`Loaded test data from: ${filePath}`);
      return data;
    } catch (error) {
      const errorMsg = `Failed to parse test data file: ${filePath}`;
      logger.error(errorMsg, error);
      throw new Error(errorMsg);
    }
  }

  /**
   * Clear the data cache (useful between test suites).
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug('Data cache cleared');
  }
}
