import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Server-side client for the Intelli Partner API (api.intelliconcierge.dev).
 *
 * RestaurantsOS is an Intelli partner: instead of talking to Meta directly,
 * WhatsApp clients are onboarded, messaged, and received through Intelli, which
 * acts as the WhatsApp Business Solution Provider. All calls authenticate with
 * the partner key (`ik_live_...` / `ik_test_...`) which never leaves the server.
 *
 * Required env:
 *   INTELLI_API_BASE        Base URL, no trailing slash. Defaults to the public
 *                           edge. For local dev point at the portal edge
 *                           (http://localhost:3000/public/v1) or Django directly
 *                           (http://localhost:8000/api/partners).
 *   INTELLI_PARTNER_API_KEY The ik_ key created in the Intelli portal.
 *   INTELLI_WEBHOOK_SECRET  The partner webhook secret (Settings → rotate-secret),
 *                           used to verify inbound webhook signatures.
 */

const DEFAULT_BASE = "https://api.intelliconcierge.dev/v1";

function apiBase(): string {
  return (process.env.INTELLI_API_BASE || DEFAULT_BASE).replace(/\/+$/, "");
}

function apiKey(): string {
  const key = process.env.INTELLI_PARTNER_API_KEY;
  if (!key) {
    throw new Error("INTELLI_PARTNER_API_KEY is not configured.");
  }
  return key;
}

export class IntelliAPIError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "IntelliAPIError";
    this.status = status;
    this.details = details;
  }
}

type IntelliRequest = Omit<RequestInit, "body"> & { body?: unknown };

async function intelliFetch<T>(path: string, init: IntelliRequest): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    // Server-to-server; never cache partner responses.
    cache: "no-store",
  });

  const raw = await res.text();
  let parsed: unknown = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = raw;
  }

  if (!res.ok) {
    // Public edge returns { error: { code, message, details } }; Django returns
    // { error|detail: "..." }. Surface the most specific message available.
    const envelope = parsed as
      | { error?: { message?: string; details?: unknown } | string; detail?: string }
      | null;
    const message =
      (typeof envelope?.error === "object" && envelope?.error?.message) ||
      (typeof envelope?.error === "string" && envelope.error) ||
      envelope?.detail ||
      `Intelli API error (${res.status})`;
    const details =
      typeof envelope?.error === "object" ? envelope?.error?.details : undefined;
    throw new IntelliAPIError(message, res.status, details);
  }

  return parsed as T;
}

export interface IntelliClient {
  client_ref: string;
  waba_id: string;
  phone_number_id: string;
  phone_number: string;
  business_name: string;
}

/**
 * Create a hosted embedded-signup session. Returns the Intelli-hosted URL to
 * open in a popup. Intelli's Meta App ID / Config ID never reach us — the popup
 * runs entirely on Intelli's domain. Scope: clients:write.
 */
export async function createEmbeddedSignupSession(params: {
  clientRef: string;
}): Promise<{ session_id: string; url: string; expires_in: number }> {
  return intelliFetch("/embedded-signup/sessions", {
    method: "POST",
    body: { client_ref: params.clientRef },
  });
}

/**
 * Fetch an onboarded client by ref (server-to-server, ik_ key). Used to confirm
 * the result of a hosted signup without trusting the browser. Scope: clients:read.
 * Returns null if the client doesn't exist yet.
 */
export async function getClient(
  clientRef: string
): Promise<IntelliClient | null> {
  try {
    return await intelliFetch<IntelliClient>(
      `/clients/${encodeURIComponent(clientRef)}`,
      { method: "GET" }
    );
  } catch (err) {
    if (err instanceof IntelliAPIError && err.status === 404) return null;
    throw err;
  }
}

/**
 * Send a text message through an onboarded client. Scope: messages:send.
 * Test keys (ik_test_) always dry-run — no real delivery.
 */
export async function intelliSendMessage(params: {
  clientRef: string;
  to: string;
  text: string;
}): Promise<{ success: boolean; message_id: string | null; dry_run?: boolean }> {
  return intelliFetch("/messages/send", {
    method: "POST",
    body: {
      client_ref: params.clientRef,
      to: params.to,
      type: "text",
      text: { body: params.text },
    },
  });
}

/**
 * Verify an inbound webhook signature from Intelli. The header is
 * `X-Intelli-Signature: sha256=<hex>`, an HMAC-SHA256 of the raw request body
 * keyed by the partner webhook secret. Returns false on any mismatch.
 */
export function verifyIntelliSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.INTELLI_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const expected =
    "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Stable client_ref for an organization. One WhatsApp client per org. */
export function clientRefForOrg(organizationId: string): string {
  return `org-${organizationId}`;
}
