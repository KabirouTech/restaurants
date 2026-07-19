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
  /** Machine-readable error code, e.g. "account_already_connected". */
  code?: string;
  details?: unknown;
  constructor(
    message: string,
    status: number,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = "IntelliAPIError";
    this.status = status;
    this.code = code;
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
    // Public edge returns { error: { code, message, details } } or the flat
    // { error: "...", code: "..." }; Django returns { error|detail: "..." }.
    // Surface the most specific message + code available.
    const envelope = parsed as
      | {
          error?: { code?: string; message?: string; details?: unknown } | string;
          detail?: string;
          code?: string;
        }
      | null;
    const message =
      (typeof envelope?.error === "object" && envelope?.error?.message) ||
      (typeof envelope?.error === "string" && envelope.error) ||
      envelope?.detail ||
      `Intelli API error (${res.status})`;
    const code =
      (typeof envelope?.error === "object" && envelope?.error?.code) ||
      envelope?.code ||
      undefined;
    const details =
      typeof envelope?.error === "object" ? envelope?.error?.details : undefined;
    throw new IntelliAPIError(message, res.status, code, details);
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

export interface IntelliInstagramClient {
  client_ref: string;
  channel: "instagram";
  business_name: string;
  /** Instagram professional account ID, when Intelli exposes it. */
  ig_user_id?: string;
  username?: string;
}

/**
 * Create a hosted Instagram connect session. Same model as embedded signup:
 * single-use URL, valid 10 minutes, opened in a popup on Intelli's domain.
 * Throws IntelliAPIError with code "account_already_connected" (409) when the
 * Instagram account is already connected — here or via another provider.
 */
export async function createInstagramConnectSession(params: {
  clientRef: string;
}): Promise<{ session_id: string; url: string; expires_in: number }> {
  return intelliFetch("/instagram-connect/sessions", {
    method: "POST",
    body: { client_ref: params.clientRef },
  });
}

/**
 * Fetch an Instagram client by ref to confirm a hosted connect server-to-server.
 * Returns null while the client doesn't exist yet (flow not finished).
 */
export async function getInstagramClient(
  clientRef: string
): Promise<IntelliInstagramClient | null> {
  try {
    return await intelliFetch<IntelliInstagramClient>(
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
 * Works for both WhatsApp and Instagram clients (Intelli routes by client_ref).
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

/**
 * Stable client_ref for an org's Instagram client. A client_ref maps to exactly
 * one channel at Intelli, so Instagram gets its own ref alongside the WhatsApp
 * `org-<id>` one.
 */
export function instagramClientRefForOrg(organizationId: string): string {
  return `org-${organizationId}-instagram`;
}

/** Intelli caps Instagram text messages at 1000 characters. */
export const INSTAGRAM_TEXT_LIMIT = 1000;

export interface IntelliConnectionStatus {
  ok: boolean;
  base: string;
  /** True if INTELLI_PARTNER_API_KEY is present (regardless of validity). */
  keyConfigured: boolean;
  /** Masked key prefix for display, e.g. "ik_live_…" — never the full secret. */
  keyHint: string | null;
  /** True if INTELLI_WEBHOOK_SECRET is present. */
  webhookSecretConfigured: boolean;
  message: string;
}

/**
 * Health-check the Intelli Partner connection from the server. We issue a cheap
 * authenticated GET for a sentinel client_ref: a 404 means auth succeeded and
 * the edge is reachable (the client simply doesn't exist), while 401/403 means
 * the ik_ key is wrong and a network error means the edge is unreachable.
 */
export async function pingIntelliConnection(): Promise<IntelliConnectionStatus> {
  const base = apiBase();
  const rawKey = process.env.INTELLI_PARTNER_API_KEY || "";
  const keyConfigured = Boolean(rawKey);
  const keyHint = rawKey ? `${rawKey.slice(0, 8)}…` : null;
  const webhookSecretConfigured = Boolean(process.env.INTELLI_WEBHOOK_SECRET);

  const base_result = { base, keyConfigured, keyHint, webhookSecretConfigured };

  if (!keyConfigured) {
    return { ...base_result, ok: false, message: "Clé partenaire (INTELLI_PARTNER_API_KEY) non configurée." };
  }

  try {
    // Sentinel ref that should never exist → expect 404 on a healthy edge.
    await getClient("__healthcheck__");
    // Unexpectedly found (or 2xx) — connection is clearly working.
    return { ...base_result, ok: true, message: "Connexion établie." };
  } catch (err) {
    if (err instanceof IntelliAPIError) {
      if (err.status === 404) {
        return { ...base_result, ok: true, message: "Connexion établie (clé valide)." };
      }
      if (err.status === 401 || err.status === 403) {
        return { ...base_result, ok: false, message: `Clé refusée par Intelli (${err.status}).` };
      }
      return { ...base_result, ok: false, message: `Erreur Intelli (${err.status}): ${err.message}` };
    }
    return {
      ...base_result,
      ok: false,
      message: `Edge Intelli injoignable: ${err instanceof Error ? err.message : "erreur réseau"}`,
    };
  }
}
