import { rateLimit } from "express-rate-limit";

const response = { message: "Too many requests. Please try again later." };

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: response,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: response,
});

export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  keyGenerator: (req) => String(req.user._id),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: response,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => String(req.user._id),
  skip: (req) => req.method === "POST" && !req.body?.image,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: response,
});
