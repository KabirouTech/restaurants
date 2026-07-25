import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Outcome a webhook handler reports back to its route. Handlers drop a lot of
 * traffic on purpose (status callbacks, echoes, events for channels we don't
 * know) — `ignored` with a reason is what makes those drops visible in the
 * admin monitor instead of silent.
 */
export type WebhookResult = {
  status: "processed" | "ignored";
  /** Why the event was dropped, or what was done with it. Shown verbatim. */
  reason?: string;
  organizationId?: string | null;
  eventType?: string | null;
  /** Number of inbound messages persisted. */
  messages?: number;
};

export const ignored = (reason: string, extra?: Partial<WebhookResult>): WebhookResult => ({
  status: "ignored",
  reason,
  ...extra,
});

export const processed = (extra?: Partial<WebhookResult>): WebhookResult => ({
  status: "processed",
  ...extra,
});

/**
 * Best-effort event type extraction, covering both the Intelli envelope
 * (`event`) and the raw Meta envelope (`object` + the change/messaging shape).
 */
export function deriveEventType(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const p = payload as {
    event?: unknown;
    type?: unknown;
    object?: unknown;
    entry?: Array<{ changes?: Array<{ field?: unknown }>; messaging?: unknown }>;
  };

  if (typeof p.event === "string") return p.event;
  if (typeof p.type === "string") return p.type;

  if (typeof p.object === "string") {
    const field = p.entry?.[0]?.changes?.[0]?.field;
    if (typeof field === "string") return `${p.object}:${field}`;
    if (p.entry?.[0]?.messaging) return `${p.object}:messaging`;
    return p.object;
  }

  return null;
}

/**
 * Insert the event row before processing, so a handler that crashes or times
 * out still leaves a trace (it stays `pending`, which the monitor flags).
 * Returns the row id, or null if the insert itself failed — recording must
 * never break delivery.
 */
export async function recordWebhook(
  supabase: SupabaseClient,
  provider: string,
  payload: unknown
): Promise<string | null> {
  const { data, error } = await supabase
    .from("webhook_events")
    .insert({
      provider,
      payload,
      status: "pending",
      event_type: deriveEventType(payload),
    })
    .select("id")
    .single();

  if (error) {
    console.error(`[webhooks] failed to record ${provider} event:`, error.message);
    return null;
  }

  return data?.id ?? null;
}

/**
 * Record a delivery we refused before parsing — a bad HMAC signature or
 * unparseable body. Without this the most common breakage of all (a rotated
 * webhook secret) is a silent 401 that shows up nowhere.
 *
 * The body is stored as a truncated preview: it failed verification, so it's
 * untrusted and potentially not even JSON.
 */
export async function recordRejectedWebhook(
  supabase: SupabaseClient,
  provider: string,
  reason: string,
  rawBody: string
): Promise<void> {
  const { error } = await supabase.from("webhook_events").insert({
    provider,
    status: "failed",
    event_type: "rejected",
    error_log: reason,
    processed_at: new Date().toISOString(),
    duration_ms: 0,
    payload: { rejected: true, reason, raw_preview: rawBody.slice(0, 2000) },
  });

  if (error) {
    console.error(`[webhooks] failed to record rejected ${provider} delivery:`, error.message);
  }
}

/** Close out a recorded event with its outcome and handler duration. */
export async function finalizeWebhook(
  supabase: SupabaseClient,
  id: string | null,
  startedAt: number,
  outcome: WebhookResult | { status: "failed"; reason: string }
): Promise<void> {
  if (!id) return;

  const result = outcome as WebhookResult & { reason?: string };

  const { error } = await supabase
    .from("webhook_events")
    .update({
      status: outcome.status,
      error_log: result.reason ?? null,
      organization_id: result.organizationId ?? null,
      processed_at: new Date().toISOString(),
      duration_ms: Math.round(performance.now() - startedAt),
      ...(result.eventType ? { event_type: result.eventType } : {}),
    })
    .eq("id", id);

  if (error) {
    console.error(`[webhooks] failed to finalize event ${id}:`, error.message);
  }
}

/** Normalizes anything thrown by a handler into a readable one-liner. */
export function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}
