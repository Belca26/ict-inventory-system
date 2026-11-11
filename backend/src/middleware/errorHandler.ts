import { Request, Response, NextFunction } from 'express';
import { AuthError } from '../modules/auth/auth.service';
import { env } from '../config/env';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AuthError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error(err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({
    error: 'Internal server error',
    ...(env.NODE_ENV === 'development' ? { detail: message } : {}),
  });
}
