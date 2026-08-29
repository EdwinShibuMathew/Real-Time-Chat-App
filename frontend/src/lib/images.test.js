import { describe, expect, it } from "vitest";
import { MAX_IMAGE_BYTES, validateImageFile } from "./images.js";

describe("validateImageFile", () => {
  it("accepts supported images and rejects invalid or oversized files", () => {
    expect(validateImageFile(new File(["ok"], "image.png", { type: "image/png" }))).toBeNull();
    expect(validateImageFile(new File(["x"], "file.txt", { type: "text/plain" }))).toContain(
      "JPEG"
    );
    expect(validateImageFile({ type: "image/jpeg", size: MAX_IMAGE_BYTES + 1 })).toContain(
      "5 MiB"
    );
  });
});
