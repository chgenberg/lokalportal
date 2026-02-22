import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit } from "../rateLimit";

describe("checkRateLimit", () => {
  const key = "test-key-" + Math.random();

  it("allows requests under the limit", () => {
    const k = key + "-under";
    const result = checkRateLimit(k, 5, 60_000);
    expect(result.limited).toBe(false);
  });

  it("blocks requests over the limit", () => {
    const k = key + "-over";
    for (let i = 0; i < 3; i++) {
      checkRateLimit(k, 3, 60_000);
    }
    const result = checkRateLimit(k, 3, 60_000);
    expect(result.limited).toBe(true);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("resets after window expires", async () => {
    const k = key + "-expire";
    for (let i = 0; i < 3; i++) {
      checkRateLimit(k, 3, 10);
    }
    await new Promise((r) => setTimeout(r, 20));
    const result = checkRateLimit(k, 3, 10);
    expect(result.limited).toBe(false);
  });
});
