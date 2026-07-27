import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { LOG_PATHS } from '../config/constants';
import { EnvConfig } from '../config/env.config';

/**
 * Centralized logger for the API automation framework.
 * Uses Winston for structured logging with file and console transports.
 *
 * Features:
 * - JSON-formatted log output
 * - Separate files for API logs and error logs
 * - Console output with colorization
 * - Request/response logging utilities
 * - Environment-aware log levels
 */

// Ensure logs directory exists
const logsDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const envConfig = EnvConfig.getInstance();

/** Custom log format with timestamp and structured data */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  })
);

/** JSON format for file transport */
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/** Console format with colors */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);

/** Winston logger instance */
const winstonLogger = winston.createLogger({
  level: envConfig.logLevel,
  format: logFormat,
  defaultMeta: { environment: envConfig.environment },
  transports: [
    // API log file - all API request/response logs
    new winston.transports.File({
      filename: path.resolve(process.cwd(), LOG_PATHS.API_LOG),
      level: 'debug',
      format: fileFormat,
      maxsize: 10_485_760, // 10MB
      maxFiles: 5,
    }),
    // Error log file - only errors
    new winston.transports.File({
      filename: path.resolve(process.cwd(), LOG_PATHS.ERROR_LOG),
      level: 'error',
      format: fileFormat,
      maxsize: 5_242_880, // 5MB
      maxFiles: 3,
    }),
    // Console output
    new winston.transports.Console({
      format: consoleFormat,
      level: envConfig.logLevel,
    }),
  ],
});

/**
 * Request/Response data structure for logging.
 */
export interface RequestLogData {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  queryParams?: Record<string, string>;
}

export interface ResponseLogData {
  statusCode: number;
  headers?: Record<string, string>;
  body?: unknown;
  responseTime: number;
}

/**
 * Logger class providing structured API logging.
 */
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  /** Log an informational message */
  info(message: string, meta?: Record<string, unknown>): void {
    winstonLogger.info(`[${this.context}] ${message}`, meta);
  }

  /** Log a debug message */
  debug(message: string, meta?: Record<string, unknown>): void {
    winstonLogger.debug(`[${this.context}] ${message}`, meta);
  }

  /** Log a warning message */
  warn(message: string, meta?: Record<string, unknown>): void {
    winstonLogger.warn(`[${this.context}] ${message}`, meta);
  }

  /** Log an error message */
  error(message: string, error?: Error | unknown): void {
    if (error instanceof Error) {
      winstonLogger.error(`[${this.context}] ${message}`, {
        error: error.message,
        stack: error.stack,
      });
    } else {
      winstonLogger.error(`[${this.context}] ${message}`, { error });
    }
  }

  /**
   * Log a complete API request with all details.
   */
  logRequest(data: RequestLogData): void {
    const sanitizedHeaders = this.sanitizeHeaders(data.headers || {});
    winstonLogger.info(`[${this.context}] ➡️  REQUEST`, {
      method: data.method,
      url: data.url,
      headers: sanitizedHeaders,
      body: data.body ? JSON.stringify(data.body) : undefined,
      queryParams: data.queryParams,
    });
  }

  /**
   * Log a complete API response with all details.
   */
  logResponse(data: ResponseLogData): void {
    const logLevel = data.statusCode >= 400 ? 'warn' : 'info';
    winstonLogger.log(logLevel, `[${this.context}] ⬅️  RESPONSE`, {
      statusCode: data.statusCode,
      responseTime: `${data.responseTime}ms`,
      headers: data.headers,
      body: typeof data.body === 'string' ? this.truncateBody(data.body) : data.body,
    });
  }

  /**
   * Log both request and response together for correlation.
   */
  logRequestResponse(request: RequestLogData, response: ResponseLogData): void {
    this.logRequest(request);
    this.logResponse(response);
  }

  /**
   * Sanitize headers by masking sensitive values (Authorization tokens).
   */
  private sanitizeHeaders(
    headers: Record<string, string>
  ): Record<string, string> {
    const sanitized = { ...headers };
    if (sanitized['Authorization']) {
      sanitized['Authorization'] = sanitized['Authorization'].substring(0, 20) + '...***';
    }
    return sanitized;
  }

  /**
   * Truncate very long response bodies for logging.
   */
  private truncateBody(body: string, maxLength: number = 2000): string {
    if (body.length > maxLength) {
      return body.substring(0, maxLength) + `... [truncated ${body.length - maxLength} chars]`;
    }
    return body;
  }
}

/**
 * Create a logger instance for a specific context/module.
 *
 * @example
 * ```typescript
 * const logger = createLogger('TokenManager');
 * logger.info('Token generated successfully');
 * ```
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}
