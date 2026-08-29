import { describe, expect, it } from "vitest";
import { getApiError } from "./errors.js";

describe("getApiError", () => {
  it("handles API, network, and fallback errors", () => {
    expect(getApiError({ response: { data: { message: "Invalid request" } } })).toBe(
      "Invalid request"
    );
    expect(getApiError(new Error("offline"))).toContain("Unable to reach");
    expect(getApiError({ response: { data: {} } }, "Fallback")).toBe("Fallback");
  });
});
