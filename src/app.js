import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import config from './config/index.js';
import { initDatabase, saveDatabase } from './config/database.js';
import swaggerSpec from './config/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import AppError from './utils/AppError.js';

// route modules
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import recordRoutes from './routes/records.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();

// ── global middleware ────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));  // reject abnormally large payloads
app.use(morgan('dev'));
app.use('/api', apiLimiter);

// ── API docs ─────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Finance API Docs',
}));

// ── routes ───────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── health check ─────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 catch‑all ────────────────────────────────────────────────
app.all('*', (req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found.`, 404));
});

// ── global error handler (must be last) ──────────────────────────
app.use(errorHandler);

// ── auto‑save the db to disk every 30 seconds ───────────────────
let saveInterval;

// ── start ────────────────────────────────────────────────────────
async function startServer() {
  await initDatabase();
  console.log('✅ Database initialised');

  saveInterval = setInterval(saveDatabase, 30_000);

  const server = app.listen(config.port, () => {
    console.log(`🚀 Server running on http://localhost:${config.port}`);
    console.log(`📄 API docs at http://localhost:${config.port}/api/docs`);
  });

  // graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Shutting down...');
    clearInterval(saveInterval);
    saveDatabase();
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// only start listening if this file is run directly (not imported by tests)
if (process.argv[1] && !process.argv[1].includes('jest')) {
  startServer();
}

export { app, startServer };
