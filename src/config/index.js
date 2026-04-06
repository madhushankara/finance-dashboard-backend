import 'dotenv/config';

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-do-not-use-in-prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  db: {
    path: process.env.DB_PATH || './data/finance.db',
  },

  // rate‑limiting defaults (per window)
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100,
  },
};

export default config;
