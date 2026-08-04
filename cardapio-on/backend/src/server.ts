import { createApp } from './app.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';

const PORT = Number(process.env.PORT ?? 3333);

async function main() {
  const app = createApp();

  const server = app.listen(PORT, () => {
    logger.info({ port: PORT }, 'API iniciada');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Encerrando servidor...');
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err: unknown) => {
  logger.error({ err }, 'Falha ao iniciar servidor');
  process.exit(1);
});
