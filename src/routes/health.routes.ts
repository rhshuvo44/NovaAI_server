import { Router, Request, Response } from 'express';
import { isDatabaseConnected, getConnectionState } from '@config/database/mongoose';
import { ApiResponse } from '@shared/responses/api-response';
import { env } from '@config/env';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  ApiResponse.success(res, {
    status: 'ok',
    service: env.APP_NAME,
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.get('/health/live', (_req: Request, res: Response) => {
  ApiResponse.success(res, { status: 'alive' });
});

router.get('/health/ready', (_req: Request, res: Response) => {
  const dbReady = isDatabaseConnected();
  const ready = dbReady;

  ApiResponse.success(
    res,
    {
      status: ready ? 'ready' : 'not_ready',
      dependencies: {
        mongodb: { connected: dbReady, state: getConnectionState() },
      },
    },
    ready ? 'Service is ready' : 'Service is not ready',
    ready ? 200 : 503
  );
});

export default router;
