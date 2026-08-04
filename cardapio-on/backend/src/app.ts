import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttpImport from 'pino-http';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { logger } from './lib/logger.js';

type PinoHttpFactory = (options: {
  logger: typeof logger;
  autoLogging?: boolean;
}) => (req: express.Request, res: express.Response, next: express.NextFunction) => void;

const pinoHttp = pinoHttpImport as unknown as PinoHttpFactory;

export function createApp() {
  const app = express();

  const allowedOrigins = (
    process.env.FRONTEND_URLS ??
    process.env.FRONTEND_URL ??
    'http://localhost:5173,http://localhost:5174'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));
  app.use(
    pinoHttp({
      logger,
      autoLogging: process.env.NODE_ENV !== 'test',
    }),
  );

  app.use('/api', routes);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Rota não encontrada.' });
  });

  app.use(errorHandler);

  return app;
}
