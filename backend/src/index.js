import http from "node:http";
import { validateEnv } from "./config/env.js";

async function start() {
  const env = validateEnv();
  const [{ createApp }, { connectDB, disconnectDB }, { initializeSocket, closeSocket }, { logger }] =
    await Promise.all([
      import("./app.js"),
      import("./lib/db.js"),
      import("./lib/socket.js"),
      import("./lib/logger.js"),
    ]);

  const connection = await connectDB();
  logger.info({ host: connection.connection.host }, "MongoDB connected");

  const server = http.createServer(createApp());
  initializeSocket(server);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(env.PORT, () => {
      server.off("error", reject);
      resolve();
    });
  });
  logger.info({ port: env.PORT }, "Server listening");

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "Shutting down");
    const forceExit = setTimeout(() => process.exit(1), 10_000);
    forceExit.unref();

    try {
      await closeSocket();
      if (server.listening) {
        await new Promise((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        });
      }
      await disconnectDB();
      clearTimeout(forceExit);
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, "Graceful shutdown failed");
      process.exit(1);
    }

  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
