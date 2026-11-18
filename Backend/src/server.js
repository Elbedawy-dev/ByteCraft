const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');

/**
 * Server Entrypoint
 * 
 * WHY:
 * Separating `app.js` (Express configuration) from `server.js` (HTTP listener & DB initialization)
 * enables clean integration testing without spinning up actual network ports,
 * while managing graceful shutdown signals (SIGINT, SIGTERM) cleanly.
 */

const orderService = require('./services/order.service');

let server;

async function startServer() {
  // 1. Establish database connection before accepting incoming traffic
  await connectDB();

  // 2. Start HTTP server
  server = app.listen(env.PORT, () => {
    console.log(`ByteCraft Server running in [${env.NODE_ENV}] mode on http://localhost:${env.PORT}`);
    console.log(`Health Check: http://localhost:${env.PORT}/api/health\n`);
  });

  // 3. Start recurring abandoned orders cleanup job (every 30 mins, unref'd)
  if (process.env.NODE_ENV !== 'test') {
    const cleanupInterval = setInterval(() => {
      orderService.expireAbandonedOrders().catch((err) => {
        console.error('Abandoned orders cleanup error:', err.message);
      });
    }, 30 * 60 * 1000);
    cleanupInterval.unref();
  }
}

// Graceful shutdown handler
async function handleShutdown(signal) {
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      await disconnectDB();
      console.log('Process terminated gracefully.');
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }

  // Force shutdown if cleanup takes too long
  setTimeout(() => {
    console.error('Forcefully terminating process due to shutdown timeout.');
    process.exit(1);
  }, 10000);
}

// Listen for process termination signals
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// Catch unhandled promise rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

startServer();
