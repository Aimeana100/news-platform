import { Logger } from '@nestjs/common';
import { Transform, plainToInstance } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  ValidationError,
  validateSync,
} from 'class-validator';

export enum NodeEnvironment {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

export enum AppLogLevel {
  Fatal = 'fatal',
  Error = 'error',
  Warn = 'warn',
  Log = 'log',
  Debug = 'debug',
  Verbose = 'verbose',
}

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const FALSE_VALUES = new Set(['0', 'false', 'no', 'off']);

const toBoolean = (value: unknown): unknown => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) {
    return true;
  }

  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  return value;
};

const toInteger = (value: unknown): unknown => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    return value;
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isNaN(parsed) ? value : parsed;
};

const toStringArray = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter((entry) => entry.length > 0);
  }

  if (typeof value !== 'string') {
    return value;
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

export class EnvironmentVariables {
  @IsEnum(NodeEnvironment, {
    message: 'NODE_ENV must be one of: development, test, production',
  })
  NODE_ENV: NodeEnvironment = NodeEnvironment.Development;

  @IsString({ message: 'APP_NAME must be a string' })
  @IsNotEmpty({ message: 'APP_NAME must not be empty' })
  APP_NAME = 'news-platform-backend';

  @IsString({ message: 'APP_VERSION must be a string' })
  @IsNotEmpty({ message: 'APP_VERSION must not be empty' })
  APP_VERSION = '1.0.0';

  @IsString({ message: 'HOST must be a string' })
  @IsNotEmpty({ message: 'HOST must not be empty' })
  HOST = '0.0.0.0';

  @Transform(({ value }) => toInteger(value))
  @IsInt({ message: 'PORT must be an integer' })
  @Min(1, { message: 'PORT must be between 1 and 65535' })
  @Max(65535, { message: 'PORT must be between 1 and 65535' })
  PORT = 3000;

  @IsString({ message: 'API_PREFIX must be a string' })
  @IsNotEmpty({ message: 'API_PREFIX must not be empty' })
  API_PREFIX = 'api/v1';

  @Transform(({ value }) => toStringArray(value))
  @IsArray({ message: 'CORS_ORIGIN must be a comma-separated list' })
  @ArrayMinSize(1, { message: 'CORS_ORIGIN must include at least one origin' })
  @IsString({
    each: true,
    message: 'CORS_ORIGIN entries must be strings',
  })
  @IsNotEmpty({
    each: true,
    message: 'CORS_ORIGIN entries must not be empty',
  })
  CORS_ORIGIN: string[] = ['*'];

  @IsEnum(AppLogLevel, {
    message:
      'LOG_LEVEL must be one of: fatal, error, warn, log, debug, verbose',
  })
  LOG_LEVEL: AppLogLevel = AppLogLevel.Log;

  @Transform(({ value }) => toBoolean(value))
  @IsBoolean({ message: 'LOG_PRETTY must be a boolean' })
  LOG_PRETTY = false;

  @Transform(({ value }) => toBoolean(value))
  @IsBoolean({ message: 'LOG_FILE_ENABLED must be a boolean' })
  LOG_FILE_ENABLED = true;

  @IsEnum(AppLogLevel, {
    message:
      'LOG_FILE_LEVEL must be one of: fatal, error, warn, log, debug, verbose',
  })
  LOG_FILE_LEVEL: AppLogLevel = AppLogLevel.Log;

  @IsString({ message: 'LOG_FILE_DIR must be a string' })
  @IsNotEmpty({ message: 'LOG_FILE_DIR must not be empty' })
  LOG_FILE_DIR = 'logs';

  @Transform(({ value }) => toInteger(value))
  @IsInt({ message: 'LOG_FILE_MAX_SIZE_MB must be an integer' })
  @Min(1, { message: 'LOG_FILE_MAX_SIZE_MB must be between 1 and 1024' })
  @Max(1024, { message: 'LOG_FILE_MAX_SIZE_MB must be between 1 and 1024' })
  LOG_FILE_MAX_SIZE_MB = 20;

  @Transform(({ value }) => toInteger(value))
  @IsInt({ message: 'LOG_FILE_MAX_FILES must be an integer' })
  @Min(1, { message: 'LOG_FILE_MAX_FILES must be between 1 and 365' })
  @Max(365, { message: 'LOG_FILE_MAX_FILES must be between 1 and 365' })
  LOG_FILE_MAX_FILES = 30;

  @Transform(({ value }) => toBoolean(value))
  @IsBoolean({ message: 'TRUST_PROXY must be a boolean' })
  TRUST_PROXY = false;

  @IsString({ message: 'DATABASE_URL is required and must be a string' })
  @IsNotEmpty({ message: 'DATABASE_URL must not be empty' })
  @IsUrl(
    {
      protocols: ['postgres', 'postgresql'],
      require_protocol: true,
      require_tld: false,
    },
    {
      message: 'DATABASE_URL must be a valid postgres:// or postgresql:// URL',
    },
  )
  DATABASE_URL!: string;

  @Transform(({ value }) => toInteger(value))
  @IsInt({ message: 'DB_POOL_MAX must be an integer' })
  @Min(1, { message: 'DB_POOL_MAX must be between 1 and 100' })
  @Max(100, { message: 'DB_POOL_MAX must be between 1 and 100' })
  DB_POOL_MAX = 20;

  @Transform(({ value }) => toInteger(value))
  @IsInt({ message: 'DB_POOL_IDLE_TIMEOUT_MS must be an integer' })
  @Min(1000, {
    message: 'DB_POOL_IDLE_TIMEOUT_MS must be between 1000 and 600000',
  })
  @Max(600000, {
    message: 'DB_POOL_IDLE_TIMEOUT_MS must be between 1000 and 600000',
  })
  DB_POOL_IDLE_TIMEOUT_MS = 30000;

  @Transform(({ value }) => toInteger(value))
  @IsInt({ message: 'DB_POOL_CONNECTION_TIMEOUT_MS must be an integer' })
  @Min(1000, {
    message: 'DB_POOL_CONNECTION_TIMEOUT_MS must be between 1000 and 120000',
  })
  @Max(120000, {
    message: 'DB_POOL_CONNECTION_TIMEOUT_MS must be between 1000 and 120000',
  })
  DB_POOL_CONNECTION_TIMEOUT_MS = 10000;

  @IsString({ message: 'REDIS_URL is required and must be a string' })
  @IsNotEmpty({ message: 'REDIS_URL must not be empty' })
  @IsUrl(
    {
      protocols: ['redis', 'rediss'],
      require_protocol: true,
      require_tld: false,
    },
    {
      message: 'REDIS_URL must be a valid redis:// or rediss:// URL',
    },
  )
  REDIS_URL!: string;

  @IsString({ message: 'JWT_SECRET is required and must be a string' })
  @IsNotEmpty({ message: 'JWT_SECRET must not be empty' })
  @MinLength(32, {
    message: 'JWT_SECRET must be at least 32 characters long',
  })
  JWT_SECRET!: string;

  @IsString({ message: 'JWT_EXPIRES_IN must be a string' })
  @IsNotEmpty({ message: 'JWT_EXPIRES_IN must not be empty' })
  JWT_EXPIRES_IN = '15m';

  @Transform(({ value }) => toBoolean(value))
  @IsBoolean({ message: 'SWAGGER_ENABLED must be a boolean' })
  SWAGGER_ENABLED = true;

  @IsString({ message: 'SWAGGER_PATH must be a string' })
  @IsNotEmpty({ message: 'SWAGGER_PATH must not be empty' })
  SWAGGER_PATH = 'docs';

  @IsString({ message: 'SWAGGER_TITLE must be a string' })
  @IsNotEmpty({ message: 'SWAGGER_TITLE must not be empty' })
  SWAGGER_TITLE = 'News Platform API';

  @IsString({ message: 'SWAGGER_DESCRIPTION must be a string' })
  @IsNotEmpty({ message: 'SWAGGER_DESCRIPTION must not be empty' })
  SWAGGER_DESCRIPTION =
    'Production-ready backend foundation for the news platform.';

  @IsString({ message: 'SWAGGER_VERSION must be a string' })
  @IsNotEmpty({ message: 'SWAGGER_VERSION must not be empty' })
  SWAGGER_VERSION = '1.0.0';
}

const configValidationLogger = new Logger('ConfigValidation');

const flattenValidationErrors = (
  validationErrors: ValidationError[],
  parentPath = '',
): string[] => {
  return validationErrors.flatMap((error) => {
    const currentPath = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    const currentErrors = Object.values(error.constraints ?? {}).map(
      (message) => `${currentPath}: ${message}`,
    );
    const childErrors = flattenValidationErrors(
      error.children ?? [],
      currentPath,
    );

    return [...currentErrors, ...childErrors];
  });
};

export const transformEnvironment = (
  config: Record<string, unknown>,
): EnvironmentVariables =>
  plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

export const validateEnvironment = (
  config: Record<string, unknown>,
): Record<string, unknown> => {
  const environment = transformEnvironment(config);
  const errors = validateSync(environment, {
    skipMissingProperties: false,
    whitelist: true,
    forbidUnknownValues: true,
    stopAtFirstError: true,
    validationError: {
      target: false,
      value: false,
    },
  });

  if (errors.length > 0) {
    const details = flattenValidationErrors(errors);
    configValidationLogger.error(
      'Environment validation failed. Startup aborted.',
    );
    details.forEach((detail) => configValidationLogger.error(`- ${detail}`));

    throw new Error('Invalid environment configuration');
  }

  return environment as unknown as Record<string, unknown>;
};
