import { mkdirSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { ConfigService } from '@nestjs/config';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModuleOptions,
} from 'nest-winston';
import {
  addColors,
  format,
  LoggerOptions,
  transport,
  transports,
} from 'winston';
import { RuntimeConfig } from '../config/configuration';
import { AppLogLevel, NodeEnvironment } from '../config/env.validation';

const winstonLevels: LoggerOptions['levels'] = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  verbose: 5,
};

addColors({
  fatal: 'red bold',
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  verbose: 'magenta',
});

const SENSITIVE_FIELD_PATTERN =
  /(password|secret|token|authorization|api[-_]?key|cookie|set-cookie|jwt)/i;

const redactSensitiveData = (
  value: unknown,
  visited: WeakSet<object>,
): void => {
  if (value === null || typeof value !== 'object') {
    return;
  }

  if (visited.has(value)) {
    return;
  }
  visited.add(value);

  if (Array.isArray(value)) {
    value.forEach((entry) => redactSensitiveData(entry, visited));
    return;
  }

  for (const [key, entry] of Object.entries(value)) {
    if (SENSITIVE_FIELD_PATTERN.test(key)) {
      (value as Record<string, unknown>)[key] = '[REDACTED]';
      continue;
    }

    redactSensitiveData(entry, visited);
  }
};

const redactionFormat = format((info) => {
  redactSensitiveData(info, new WeakSet<object>());
  return info;
});

const createFileFormat = (): ReturnType<typeof format.combine> =>
  format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    redactionFormat(),
    format.json(),
  );

const resolveLogDirectory = (directory: string): string => {
  const logDirectory = isAbsolute(directory)
    ? directory
    : resolve(process.cwd(), directory);

  mkdirSync(logDirectory, { recursive: true });
  return logDirectory;
};

const createFileTransports = (
  config: RuntimeConfig['logging']['file'],
): {
  transports: transport[];
  exceptionHandlers: transport[];
  rejectionHandlers: transport[];
} => {
  if (!config.enabled) {
    return {
      transports: [],
      exceptionHandlers: [],
      rejectionHandlers: [],
    };
  }

  let dirname: string;
  try {
    dirname = resolveLogDirectory(config.dir);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[WinstonFileTransport] Failed to prepare log directory "${config.dir}": ${message}`,
    );

    return {
      transports: [],
      exceptionHandlers: [],
      rejectionHandlers: [],
    };
  }

  const maxSizeBytes = config.maxSizeMb * 1024 * 1024;
  const level = resolveLevel(config.level);
  const appTransport = new transports.File({
    dirname,
    filename: 'application.log',
    level,
    maxsize: maxSizeBytes,
    maxFiles: config.maxFiles,
    tailable: true,
    format: createFileFormat(),
  });
  const errorTransport = new transports.File({
    dirname,
    filename: 'error.log',
    level: 'error',
    maxsize: maxSizeBytes,
    maxFiles: config.maxFiles,
    tailable: true,
    format: createFileFormat(),
  });
  const exceptionTransport = new transports.File({
    dirname,
    filename: 'exceptions.log',
    maxsize: maxSizeBytes,
    maxFiles: config.maxFiles,
    tailable: true,
    format: createFileFormat(),
  });
  const rejectionTransport = new transports.File({
    dirname,
    filename: 'rejections.log',
    maxsize: maxSizeBytes,
    maxFiles: config.maxFiles,
    tailable: true,
    format: createFileFormat(),
  });

  const transportsToMonitor = [
    ['WinstonFileTransport:application', appTransport],
    ['WinstonFileTransport:error', errorTransport],
    ['WinstonFileTransport:exceptions', exceptionTransport],
    ['WinstonFileTransport:rejections', rejectionTransport],
  ] as const;

  transportsToMonitor.forEach(([label, fileTransport]) => {
    fileTransport.on('error', (error) => {
      // Avoid recursive logger calls in case disk logging fails.
      console.error(`[${label}] ${error.message}`);
    });
  });

  return {
    transports: [appTransport, errorTransport],
    exceptionHandlers: [exceptionTransport],
    rejectionHandlers: [rejectionTransport],
  };
};

const createConsoleFormat = (
  appName: string,
  nodeEnv: NodeEnvironment,
  pretty: boolean,
): ReturnType<typeof format.combine> => {
  const common = [
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
  ];

  if (nodeEnv === NodeEnvironment.Production && !pretty) {
    return format.combine(...common, redactionFormat(), format.json());
  }

  return format.combine(
    ...common,
    redactionFormat(),
    nestWinstonModuleUtilities.format.nestLike(appName, {
      colors: nodeEnv !== NodeEnvironment.Production,
      prettyPrint: pretty,
      processId: true,
      appName: true,
    }),
  );
};

const resolveLevel = (level: AppLogLevel): string => {
  if (level === AppLogLevel.Log) {
    return 'info';
  }

  return level;
};

export const createWinstonLoggerOptions = (
  configService: ConfigService<RuntimeConfig, true>,
): WinstonModuleOptions => {
  const appName = configService.get('app.name', { infer: true });
  const nodeEnv = configService.get('nodeEnv', { infer: true });
  const logLevel = resolveLevel(
    configService.get('app.logLevel', { infer: true }),
  );
  const pretty = configService.get('logging.pretty', { infer: true });
  const fileConfig = configService.get('logging.file', { infer: true });

  const consoleTransport = new transports.Console({
    level: logLevel,
    stderrLevels: ['fatal', 'error'],
    format: createConsoleFormat(appName, nodeEnv, pretty),
  });

  const transportList: transport[] = [consoleTransport];
  const exceptionHandlers: transport[] = [consoleTransport];
  const rejectionHandlers: transport[] = [consoleTransport];

  const fileTransports = createFileTransports(fileConfig);
  transportList.push(...fileTransports.transports);
  exceptionHandlers.push(...fileTransports.exceptionHandlers);
  rejectionHandlers.push(...fileTransports.rejectionHandlers);

  return {
    levels: winstonLevels,
    level: logLevel,
    defaultMeta: {
      service: appName,
      environment: nodeEnv,
    },
    transports: transportList,
    exceptionHandlers,
    rejectionHandlers,
  };
};
