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
    'http://localhost:5173,http://localhost:5174,http://localhost:5176,http://localhost:5177'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const isLocalDevOrigin = (origin: string) =>
    process.env.NODE_ENV !== 'production' &&
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

  app.use(
    cors({
      origin(origin, callback) {
        if (
          !origin ||
          allowedOrigins.includes('*') ||
          allowedOrigins.includes(origin) ||
          isLocalDevOrigin(origin)
        ) {
          callback(null, true);
          return;
        }
        // Não lançar erro: evita request sem headers CORS no browser
        callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(express.json({ limit: '6mb' }));
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
