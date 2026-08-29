import { config as loadDotenv } from "dotenv";
import { z } from "zod";

loadDotenv();

const optionalCloudinaryValue = z.string().trim().optional().default("");

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().max(65535).default(5001),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    CLIENT_ORIGIN: z.url().default("http://localhost:5173"),
    CLOUDINARY_CLOUD_NAME: optionalCloudinaryValue,
    CLOUDINARY_API_KEY: optionalCloudinaryValue,
    CLOUDINARY_API_SECRET: optionalCloudinaryValue,
  })
  .superRefine((values, context) => {
    if (values.NODE_ENV !== "test") {
      for (const key of [
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET",
      ]) {
        if (!values[key]) {
          context.addIssue({ code: "custom", path: [key], message: `${key} is required` });
        }
      }
    }
  });

export function validateEnv(source = process.env) {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  Object.assign(process.env, {
    NODE_ENV: result.data.NODE_ENV,
    PORT: String(result.data.PORT),
    MONGODB_URI: result.data.MONGODB_URI,
    JWT_SECRET: result.data.JWT_SECRET,
    CLIENT_ORIGIN: result.data.CLIENT_ORIGIN,
    CLOUDINARY_CLOUD_NAME: result.data.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: result.data.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: result.data.CLOUDINARY_API_SECRET,
  });

  return result.data;
}
