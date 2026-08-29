import http from "node:http";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { io as createClient } from "socket.io-client";

vi.mock("../src/lib/cloudinary.js", () => ({
  default: {
    uploader: {
      upload: vi.fn().mockResolvedValue({
        secure_url: "https://cdn.example/avatar.png",
        public_id: "chat-app/avatars/test",
      }),
      destroy: vi.fn().mockResolvedValue({ result: "ok" }),
    },
  },
}));

const { createApp } = await import("../src/app.js");
const { initializeSocket, closeSocket } = await import("../src/lib/socket.js");
const { default: User } = await import("../src/models/user.model.js");
const { default: Message } = await import("../src/models/message.model.js");

let mongo;
let app;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  app = createApp();
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Message.deleteMany({})]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

describe("authentication and private user data", () => {
  it("reports database readiness", async () => {
    const response = await request(app).get("/api/health").expect(200);
    expect(response.body).toEqual({ status: "ok", database: "connected" });
  });

  it("validates signup and never exposes password fields", async () => {
    await request(app)
      .post("/api/auth/signup")
      .send({ fullName: "Test User", email: "test@example.com", password: "short" })
      .expect(400);

    const agent = request.agent(app);
    const signup = await agent
      .post("/api/auth/signup")
      .send({ fullName: " Test User ", email: "TEST@example.com", password: "password123" })
      .expect(201);

    expect(signup.body).toMatchObject({ fullName: "Test User", email: "test@example.com" });
    expect(signup.body).not.toHaveProperty("password");
    expect(signup.headers["set-cookie"][0]).toContain("Path=/");

    const check = await agent.get("/api/auth/check").expect(200);
    expect(check.body).not.toHaveProperty("password");

    await request(app)
      .post("/api/auth/signup")
      .send({ fullName: "Other", email: "test@example.com", password: "password123" })
      .expect(409);
  });

  it("returns 401 for invalid tokens and clears the session cookie", async () => {
    await request(app).get("/api/auth/check").set("Cookie", "jwt=invalid").expect(401);

    const response = await request(app).post("/api/auth/logout").expect(200);
    expect(response.headers["set-cookie"][0]).toContain("Path=/");
  });

  it("invalidates sessions whose user has been deleted", async () => {
    const agent = request.agent(app);
    const signup = await agent
      .post("/api/auth/signup")
      .send({ fullName: "Deleted User", email: "deleted@example.com", password: "password123" });
    await User.deleteOne({ _id: signup.body._id });
    await agent.get("/api/auth/check").expect(401);
  });

  it("returns a safe DTO after an avatar update", async () => {
    const agent = request.agent(app);
    await agent
      .post("/api/auth/signup")
      .send({ fullName: "Avatar User", email: "avatar@example.com", password: "password123" });

    const response = await agent
      .put("/api/auth/update-profile")
      .send({ profilePic: "data:image/png;base64,aGVsbG8=" })
      .expect(200);

    expect(response.body.profilePic).toBe("https://cdn.example/avatar.png");
    expect(response.body).not.toHaveProperty("password");
    expect(response.body).not.toHaveProperty("profilePicPublicId");
  });
});

describe("messages", () => {
  it("validates receivers/content and returns chronological history", async () => {
    const password = await bcrypt.hash("password123", 4);
    const receiver = await User.create({
      fullName: "Receiver",
      email: "receiver@example.com",
      password,
    });
    const agent = request.agent(app);
    await agent
      .post("/api/auth/signup")
      .send({ fullName: "Sender", email: "sender@example.com", password: "password123" });

    await agent.post(`/api/messages/send/${receiver._id}`).send({ text: "   " }).expect(400);
    await agent
      .post(`/api/messages/send/${new mongoose.Types.ObjectId()}`)
      .send({ text: "hello" })
      .expect(404);

    await agent.post(`/api/messages/send/${receiver._id}`).send({ text: "first" }).expect(201);
    await agent.post(`/api/messages/send/${receiver._id}`).send({ text: "second" }).expect(201);
    const history = await agent.get(`/api/messages/${receiver._id}`).expect(200);
    expect(history.body.map((message) => message.text)).toEqual(["first", "second"]);
  });
});

describe("Socket.IO authentication", () => {
  it("rejects anonymous clients and accepts the JWT cookie", async () => {
    const server = http.createServer(app);
    initializeSocket(server);
    await new Promise((resolve) => server.listen(0, resolve));
    const url = `http://127.0.0.1:${server.address().port}`;

    const anonymousError = await new Promise((resolve) => {
      const client = createClient(url, { transports: ["websocket"], reconnection: false });
      client.on("connect_error", (error) => {
        client.close();
        resolve(error.message);
      });
    });
    expect(anonymousError).toBe("Unauthorized");

    const signup = await request(app)
      .post("/api/auth/signup")
      .send({ fullName: "Socket User", email: "socket@example.com", password: "password123" });
    const cookie = signup.headers["set-cookie"][0].split(";")[0];
    const connected = await new Promise((resolve, reject) => {
      const client = createClient(url, {
        transports: ["websocket"],
        extraHeaders: { Cookie: cookie },
        reconnection: false,
      });
      client.on("connect", () => {
        client.close();
        resolve(true);
      });
      client.on("connect_error", reject);
    });
    expect(connected).toBe(true);

    await closeSocket();
    if (server.listening) await new Promise((resolve) => server.close(resolve));
  });
});
