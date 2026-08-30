import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { logger } from "./logger.js";

let io;
const connectionCounts = new Map();

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((item) => item.trim())
      .filter((item) => item.includes("="))
      .map((item) => {
        const index = item.indexOf("=");
        return [item.slice(0, index), decodeURIComponent(item.slice(index + 1))];
      })
  );
}

const userRoom = (userId) => `user:${userId}`;

function emitOnlineUsers() {
  io.emit("getOnlineUsers", [...connectionCounts.keys()]);
}

function sendOnlineUsers(socket) {
  socket.emit("getOnlineUsers", [...connectionCounts.keys()]);
}

export function initializeSocket(server) {
  io = new Server(server, {
    cors:
      process.env.NODE_ENV === "production"
        ? undefined
        : { origin: process.env.CLIENT_ORIGIN, credentials: true },
    maxHttpBufferSize: 1024 * 1024,
  });

  io.use(async (socket, next) => {
    try {
      const token = parseCookies(socket.request.headers.cookie).jwt;
      if (!token) return next(new Error("Unauthorized"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("_id").lean();
      if (!user) return next(new Error("Unauthorized"));

      socket.data.userId = String(user._id);
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    const previousConnections = connectionCounts.get(userId) || 0;
    socket.join(userRoom(userId));
    connectionCounts.set(userId, previousConnections + 1);
    sendOnlineUsers(socket);
    if (previousConnections === 0) {
      socket.broadcast.emit("getOnlineUsers", [...connectionCounts.keys()]);
    }
    logger.info({ socketId: socket.id, userId }, "Socket connected");

    socket.on("requestOnlineUsers", () => sendOnlineUsers(socket));

    socket.on("disconnect", () => {
      const remaining = (connectionCounts.get(userId) || 1) - 1;
      if (remaining > 0) connectionCounts.set(userId, remaining);
      else {
        connectionCounts.delete(userId);
        emitOnlineUsers();
      }
      logger.info({ socketId: socket.id, userId }, "Socket disconnected");
    });
  });

  return io;
}

export function emitNewMessage(message) {
  if (!io) return;
  io.to(userRoom(String(message.receiverId)))
    .to(userRoom(String(message.senderId)))
    .emit("newMessage", message);
}

export function emitNewUser(user) {
  if (!io) return;
  io.emit("newUser", user);
}

export function closeSocket() {
  return new Promise((resolve) => {
    if (!io) return resolve();
    io.close(() => {
      io = undefined;
      connectionCounts.clear();
      resolve();
    });
  });
}
