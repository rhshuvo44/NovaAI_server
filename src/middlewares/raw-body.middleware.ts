import { Request, Response, NextFunction } from 'express';

/**
 * Captures the raw request body buffer onto req.rawBody before JSON parsing
 * consumes the stream. Required for webhook signature verification (Clerk,
 * Stripe-style providers), which must verify against the exact bytes sent,
 * not a re-serialized JSON.parse(...) round-trip.
 */
export function captureRawBody(req: Request, _res: Response, next: NextFunction): void {
  const chunks: Buffer[] = [];

  req.on('data', (chunk: Buffer) => {
    chunks.push(chunk);
  });

  req.on('end', () => {
    req.rawBody = Buffer.concat(chunks);
    next();
  });
}
