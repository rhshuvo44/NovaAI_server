import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import crypto from 'crypto';
import { env, isProduction } from '@config/env';
import { swaggerSpec } from '@config/swagger';
import apiRoutes from '@routes/index';
import healthRoutes from '@routes/health.routes';
import { globalErrorHandler, notFoundHandler } from '@middlewares/error-handler.middleware';
import { sanitizeInput, xssProtection } from '@middlewares/sanitize.middleware';
import { globalRateLimiter } from '@middlewares/rate-limit.middleware';
import { trackRequest } from '@middlewares/analytics.middleware';
import { captureRawBody } from '@middlewares/raw-body.middleware';
import { logger } from '@utils/logger';

export function createApp(): Application {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // required for correct req.ip behind a load balancer

  // Request ID: attached early so every downstream log line can be correlated.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  });

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'idempotency-key'],
    })
  );

  // Webhook routes need the raw, unparsed body for signature verification,
  // so this is registered before express.json() and only for that path.
  app.use('/api/' + env.API_VERSION + '/webhooks', captureRawBody);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(compression());

  // HTTP request logging via morgan, piped into Winston
  app.use(
    morgan(isProduction ? 'combined' : 'dev', {
      stream: { write: (message: string) => logger.http(message.trim()) },
    })
  );

  // Security sanitization
  app.use(sanitizeInput);
  app.use(xssProtection);

  // Analytics: fire-and-forget request tracking
  app.use(trackRequest);

  // Global rate limiting (route-specific limiters layer on top of this)
  app.use(`/api/${env.API_VERSION}`, globalRateLimiter);

  // Health/readiness/liveness - intentionally outside the versioned prefix
  // and rate limiter, since orchestrators poll these frequently.
  app.use('/', healthRoutes);

  // API documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req: Request, res: Response) => res.json(swaggerSpec));

  // Versioned API
  app.use(`/api/${env.API_VERSION}`, apiRoutes);

  // 404 + global error handler (must be registered last, in this order)
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
