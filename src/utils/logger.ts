import winston from 'winston';
import path from 'path';
import { env, isProduction } from '@config/env';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

const logsDir = path.join(process.cwd(), 'logs');

const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${ts} [${level}]: ${stack || message} ${metaStr}`;
  })
);

const fileFormat = combine(timestamp(), errors({ stack: true }), json());

function createFileTransport(filename: string, level?: string): winston.transport {
  return new winston.transports.File({
    filename: path.join(logsDir, filename),
    level,
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    format: fileFormat,
  });
}

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: fileFormat,
  defaultMeta: { service: env.APP_NAME },
  transports: [createFileTransport('error.log', 'error'), createFileTransport('combined.log')],
  exitOnError: false,
});

if (!isProduction) {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

export const securityLogger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  defaultMeta: { service: `${env.APP_NAME}-security` },
  transports: [createFileTransport('security.log')],
});

export const auditLogger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  defaultMeta: { service: `${env.APP_NAME}-audit` },
  transports: [createFileTransport('audit.log')],
});

export const aiLogger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  defaultMeta: { service: `${env.APP_NAME}-ai` },
  transports: [createFileTransport('ai.log')],
});

export const dbLogger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  defaultMeta: { service: `${env.APP_NAME}-database` },
  transports: [createFileTransport('database.log')],
});

if (!isProduction) {
  [securityLogger, auditLogger, aiLogger, dbLogger].forEach((l) =>
    l.add(new winston.transports.Console({ format: consoleFormat }))
  );
}
