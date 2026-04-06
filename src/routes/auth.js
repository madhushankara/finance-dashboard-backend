import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { registerSchema, loginSchema } from '../validators/authValidator.js';

const router = Router();

// public routes (rate‑limited)
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);

// protected
router.get('/me', authenticate, getMe);

export default router;
