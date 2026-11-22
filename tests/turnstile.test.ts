import { describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "../src/lib/turnstile";

describe("turnstile", () => {
  it("skips verification when the flag is off", async () => {
    const fetchImpl = vi.fn();
    const result = await verifyTurnstile({
      required: false,
      secret: undefined,
      token: undefined,
      fetchImpl,
    });
    expect(result).toEqual({ ok: true });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects a required check with no token and does not publish", async () => {
    const result = await verifyTurnstile({
      required: true,
      secret: "secret",
      token: undefined,
    });
    expect(result).toEqual({ ok: false, error: "turnstile_required" });
  });

  it("rejects when the flag is on and no secret is configured", async () => {
    const result = await verifyTurnstile({
      required: true,
      secret: undefined,
      token: "token",
    });
    expect(result).toEqual({ ok: false, error: "turnstile_not_configured" });
  });

  it("accepts a successful siteverify response", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    const result = await verifyTurnstile({
      required: true,
      secret: "secret",
      token: "token",
      fetchImpl,
    });
    expect(result).toEqual({ ok: true });
  });
});
