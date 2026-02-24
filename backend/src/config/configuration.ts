import {
  AppLogLevel,
  NodeEnvironment,
  transformEnvironment,
} from './env.validation';

export interface RuntimeConfig {
  nodeEnv: NodeEnvironment;
  app: {
    name: string;
    version: string;
    host: string;
    port: number;
    apiPrefix: string;
    corsOrigins: string[];
    logLevel: AppLogLevel;
    trustProxy: boolean;
  };
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
  };
  queue: {
    prefix: string;
    defaultAttempts: number;
  };
  logging: {
    pretty: boolean;
    file: {
      enabled: boolean;
      level: AppLogLevel;
      dir: string;
      maxSizeMb: number;
      maxFiles: number;
    };
  };
  swagger: {
    enabled: boolean;
    path: string;
    title: string;
    description: string;
    version: string;
  };
}

const configuration = (): RuntimeConfig => {
  const environment = transformEnvironment(process.env);

  return {
    nodeEnv: environment.NODE_ENV,
    app: {
      name: environment.APP_NAME,
      version: environment.APP_VERSION,
      host: environment.HOST,
      port: environment.PORT,
      apiPrefix: environment.API_PREFIX,
      corsOrigins: environment.CORS_ORIGIN,
      logLevel: environment.LOG_LEVEL,
      trustProxy: environment.TRUST_PROXY,
    },
    database: {
      url: environment.DATABASE_URL,
    },
    redis: {
      url: environment.REDIS_URL,
    },
    auth: {
      jwtSecret: environment.JWT_SECRET,
      jwtExpiresIn: environment.JWT_EXPIRES_IN,
    },
    queue: {
      prefix: environment.QUEUE_PREFIX,
      defaultAttempts: environment.QUEUE_DEFAULT_ATTEMPTS,
    },
    logging: {
      pretty:
        environment.LOG_PRETTY ||
        environment.NODE_ENV !== NodeEnvironment.Production,
      file: {
        enabled: environment.LOG_FILE_ENABLED,
        level: environment.LOG_FILE_LEVEL,
        dir: environment.LOG_FILE_DIR,
        maxSizeMb: environment.LOG_FILE_MAX_SIZE_MB,
        maxFiles: environment.LOG_FILE_MAX_FILES,
      },
    },
    swagger: {
      enabled: environment.SWAGGER_ENABLED,
      path: environment.SWAGGER_PATH,
      title: environment.SWAGGER_TITLE,
      description: environment.SWAGGER_DESCRIPTION,
      version: environment.SWAGGER_VERSION,
    },
  };
};

export default configuration;
