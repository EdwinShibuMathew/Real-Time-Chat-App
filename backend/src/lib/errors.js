export class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function notFoundHandler(req, res) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "Request payload is too large" });
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ message: "Malformed JSON request" });
  }

  req.log?.error({ err: error }, "Request failed");
  return res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : "Internal server error",
  });
}
