import http from "node:http";
import { MongoMemoryServer } from "mongodb-memory-server";

const mongo = await MongoMemoryServer.create();
Object.assign(process.env, {
  NODE_ENV: "test",
  PORT: "5001",
  MONGODB_URI: mongo.getUri(),
  JWT_SECRET: "e2e-secret-that-is-at-least-thirty-two-characters",
  CLIENT_ORIGIN: "http://localhost:5173",
  CLOUDINARY_CLOUD_NAME: "test",
  CLOUDINARY_API_KEY: "test",
  CLOUDINARY_API_SECRET: "test",
});

const [{ createApp }, { connectDB, disconnectDB }, { initializeSocket, closeSocket }] =
  await Promise.all([
    import("../src/app.js"),
    import("../src/lib/db.js"),
    import("../src/lib/socket.js"),
  ]);

await connectDB();
const server = http.createServer(createApp());
initializeSocket(server);
server.listen(5001, "127.0.0.1");

async function shutdown() {
  await closeSocket();
  if (server.listening) await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
  await mongo.stop();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
