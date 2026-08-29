import { z } from "zod";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const imagePattern = /^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/;

export const signupSchema = z.object({
  fullName: z.string().trim().min(1).max(80),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(128),
});

export const profileSchema = z.object({ profilePic: z.string().min(1) });

export const messageSchema = z
  .object({
    text: z.string().trim().max(2000).optional().default(""),
    image: z.string().nullable().optional(),
  })
  .refine((data) => data.text.length > 0 || Boolean(data.image), {
    message: "A message must include text or an image",
  });

export function validateImageDataUri(value) {
  const match = value.match(imagePattern);
  if (!match) return { valid: false, message: "Only JPEG, PNG, WebP, or GIF images are allowed" };

  const padding = match[2].endsWith("==") ? 2 : match[2].endsWith("=") ? 1 : 0;
  const bytes = Math.floor((match[2].length * 3) / 4) - padding;
  if (bytes > MAX_IMAGE_BYTES) {
    return { valid: false, message: "Image must be 5 MiB or smaller" };
  }

  return { valid: true };
}

export function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    return { error: result.error.issues[0]?.message || "Invalid request" };
  }
  return { data: result.data };
}
