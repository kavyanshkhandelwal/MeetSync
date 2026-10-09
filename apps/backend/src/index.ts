import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config';
import { connectPrisma, disconnectPrisma } from './config/prisma';
import { logger } from './utils/logger';
import { requestLogger, errorHandler, notFoundHandler } from './middlewares';
import routes from './routes';
import { auditLogService } from './services/auditLog.service';
import socketService from './services/socket.service';
import { closeReminderQueue } from './queues/reminder.queue';

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://10.135.125.247:3000'
  ],
  credentials: true
}));//allow cors for frontend url
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize services
void auditLogService;
socketService.init(server);

async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received — closing API process`);
  await closeReminderQueue();
  await disconnectPrisma();
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

// Start server
async function bootstrap(): Promise<void> {
  try {
    await connectPrisma();

    server.listen(env.PORT, () => {
      logger.info(`Server is running on http://localhost:${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`Audit logging service initialized`);
      logger.info(`Socket.IO service initialized`);
      logger.info('Reminder worker is a separate process: npm run worker --workspace backend');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
