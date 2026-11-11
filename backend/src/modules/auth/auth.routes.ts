import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { loginSchema, refreshSchema, changePasswordSchema } from './auth.schema';
import {
  loginHandler,
  refreshHandler,
  logoutHandler,
  changePasswordHandler,
  meHandler,
} from './auth.controller';

const router = Router();

// Brute-force protection on login — 10 attempts per 15 minutes per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
});

router.post('/login', loginLimiter, validate(loginSchema), loginHandler);
router.post('/refresh', validate(refreshSchema), refreshHandler);
router.post('/logout', validate(refreshSchema), logoutHandler);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePasswordHandler);
router.get('/me', authenticate, meHandler);

export default router;
