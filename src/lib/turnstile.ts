export interface TurnstileCheck {
  required: boolean;
  secret: string | undefined;
  token: string | undefined;
  remoteIp?: string;
  fetchImpl?: typeof fetch;
}

export type TurnstileResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "turnstile_required"
        | "turnstile_not_configured"
        | "turnstile_failed";
    };

/**
 * Verification is skipped when TURNSTILE_REQUIRED is not "true".
 * When it is required, a missing token, missing secret, or failed siteverify rejects the request.
 * Nothing in this function publishes a contribution.
 */
export async function verifyTurnstile(
  check: TurnstileCheck,
): Promise<TurnstileResult> {
  if (!check.required) return { ok: true };
  if (!check.token) return { ok: false, error: "turnstile_required" };
  if (!check.secret) return { ok: false, error: "turnstile_not_configured" };

  const body = new FormData();
  body.set("secret", check.secret);
  body.set("response", check.token);
  if (check.remoteIp) body.set("remoteip", check.remoteIp);

  const fetchImpl = check.fetchImpl ?? fetch;
  const response = await fetchImpl(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body,
    },
  );
  if (!response.ok) return { ok: false, error: "turnstile_failed" };
  const payload = (await response.json()) as { success?: boolean };
  if (payload.success !== true) return { ok: false, error: "turnstile_failed" };
  return { ok: true };
}
