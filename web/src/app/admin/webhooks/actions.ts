"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import {
  processIntelliWebhook,
  type IntelliWebhookPayload,
} from "@/lib/intelli/webhook";
import { describeError, deriveEventType, finalizeWebhook } from "@/lib/webhooks/recorder";
import {
  PAGE_SIZE,
  RANGES,
  type ProviderStat,
  type TimelineBucket,
  type WebhookDashboard,
  type WebhookEvent,
  type WebhookFilters,
} from "./types";

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Every entry point here reads platform-wide data — super admins only. */
async function requireSuperAdmin() {
  const { userId, profile } = await getCurrentProfile();
  if (!userId || !profile?.is_super_admin) {
    throw new Error("Accès refusé");
  }
}

type StatRow = {
  wh_provider: string;
  wh_status: string;
  event_count: number;
  avg_ms: number | null;
  p95_ms: number | null;
  last_at: string | null;
};

type TimelineRow = {
  bucket_start: string;
  total_count: number;
  processed_count: number;
  ignored_count: number;
  failed_count: number;
  pending_count: number;
  unknown_count: number;
};

type EventRow = {
  wh_id: string;
  wh_provider: string;
  wh_status: string;
  wh_event_type: string | null;
  wh_error_log: string | null;
  wh_organization_id: string | null;
  wh_organization_name: string | null;
  wh_duration_ms: number | null;
  wh_created_at: string;
  wh_processed_at: string | null;
  wh_payload: unknown;
  wh_total_count: number;
};

const EMPTY_TOTALS = {
  total: 0,
  processed: 0,
  ignored: 0,
  failed: 0,
  pending: 0,
  unknown: 0,
  avgMs: null,
  p95Ms: null,
  lastAt: null,
};

/**
 * Folds the (provider × status) grid into per-provider cards plus the headline
 * totals. `scopeTo` narrows only the totals, so the channel cards keep showing
 * every provider while a provider filter is active.
 *
 * Averages are re-weighted by event count. The p95 is taken as the worst slice
 * rather than recombined — a true cross-group percentile would need the raw
 * durations, and "the slowest slice's p95" is the number worth reacting to.
 */
function foldStats(
  rows: StatRow[],
  scopeTo: string | null
): { providers: ProviderStat[]; totals: WebhookDashboard["totals"] } {
  const byProvider = new Map<string, ProviderStat & { _weighted: number; _weight: number }>();

  for (const row of rows) {
    const key = row.wh_provider;
    const entry =
      byProvider.get(key) ??
      {
        provider: key,
        total: 0,
        processed: 0,
        ignored: 0,
        failed: 0,
        pending: 0,
        unknown: 0,
        avgMs: null,
        p95Ms: null,
        lastAt: null,
        _weighted: 0,
        _weight: 0,
      };

    const count = Number(row.event_count) || 0;
    entry.total += count;

    if (row.wh_status === "processed") entry.processed += count;
    else if (row.wh_status === "ignored") entry.ignored += count;
    else if (row.wh_status === "failed") entry.failed += count;
    else if (row.wh_status === "unknown") entry.unknown += count;
    else entry.pending += count;

    if (row.avg_ms != null) {
      entry._weighted += Number(row.avg_ms) * count;
      entry._weight += count;
    }
    if (row.p95_ms != null) {
      entry.p95Ms = Math.max(entry.p95Ms ?? 0, Number(row.p95_ms));
    }
    if (row.last_at && (!entry.lastAt || row.last_at > entry.lastAt)) {
      entry.lastAt = row.last_at;
    }

    byProvider.set(key, entry);
  }

  const providers: ProviderStat[] = [...byProvider.values()]
    .map((e) => ({
      provider: e.provider,
      total: e.total,
      processed: e.processed,
      ignored: e.ignored,
      failed: e.failed,
      pending: e.pending,
      unknown: e.unknown,
      avgMs: e._weight > 0 ? Math.round(e._weighted / e._weight) : null,
      p95Ms: e.p95Ms,
      lastAt: e.lastAt,
    }))
    .sort((a, b) => b.total - a.total);

  const scoped = [...byProvider.values()].filter((e) => !scopeTo || e.provider === scopeTo);
  const totalWeight = scoped.reduce((s, e) => s + e._weight, 0);
  const totalWeighted = scoped.reduce((s, e) => s + e._weighted, 0);

  const totals: WebhookDashboard["totals"] = {
    total: scoped.reduce((s, p) => s + p.total, 0),
    processed: scoped.reduce((s, p) => s + p.processed, 0),
    ignored: scoped.reduce((s, p) => s + p.ignored, 0),
    failed: scoped.reduce((s, p) => s + p.failed, 0),
    pending: scoped.reduce((s, p) => s + p.pending, 0),
    unknown: scoped.reduce((s, p) => s + p.unknown, 0),
    avgMs: totalWeight > 0 ? Math.round(totalWeighted / totalWeight) : null,
    p95Ms: scoped.reduce<number | null>(
      (max, p) => (p.p95Ms == null ? max : Math.max(max ?? 0, p.p95Ms)),
      null
    ),
    lastAt: scoped.reduce<string | null>(
      (latest, p) => (p.lastAt && (!latest || p.lastAt > latest) ? p.lastAt : latest),
      null
    ),
  };

  return { providers, totals };
}

function mapEvent(row: EventRow): WebhookEvent {
  return {
    id: row.wh_id,
    provider: row.wh_provider,
    status: row.wh_status,
    // Rows written before the routes were instrumented have no event_type, but
    // their payload still names the event — read it back rather than showing
    // "type inconnu" over a payload that plainly says `message.received`.
    eventType: row.wh_event_type ?? deriveEventType(row.wh_payload),
    errorLog: row.wh_error_log,
    organizationId: row.wh_organization_id,
    organizationName: row.wh_organization_name,
    durationMs: row.wh_duration_ms,
    createdAt: row.wh_created_at,
    processedAt: row.wh_processed_at,
    payload: row.wh_payload,
  };
}

/** A missing RPC/column means the monitoring migration hasn't run yet. */
function isSchemaError(message: string | undefined) {
  if (!message) return false;
  return (
    message.includes("admin_webhook_") ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}

/**
 * One call powers the whole page: stats, timeline and the first page of events.
 * Called on mount and on every refresh tick, so it stays a fixed 3 queries.
 */
export async function fetchWebhookDashboard(
  filters: WebhookFilters,
  offset = 0
): Promise<WebhookDashboard> {
  await requireSuperAdmin();

  const supabase = adminClient();
  const { hours, bucketMinutes } = RANGES[filters.range] ?? RANGES["24h"];
  const since = new Date(Date.now() - hours * 3600_000).toISOString();

  const [statsRes, timelineRes, eventsRes] = await Promise.all([
    supabase.rpc("admin_webhook_stats", { p_since: since }),
    supabase.rpc("admin_webhook_timeline", {
      p_since: since,
      p_bucket_minutes: bucketMinutes,
      p_provider: filters.provider,
    }),
    supabase.rpc("admin_webhook_events", {
      p_since: since,
      p_provider: filters.provider,
      p_status: filters.status,
      p_search: filters.search?.trim() || null,
      p_limit: PAGE_SIZE,
      p_offset: offset,
    }),
  ]);

  const firstError = statsRes.error || timelineRes.error || eventsRes.error;
  if (firstError && isSchemaError(firstError.message)) {
    return {
      events: [],
      totalMatching: 0,
      providers: [],
      timeline: [],
      totals: EMPTY_TOTALS,
      schemaError:
        "Migration de monitoring non appliquée (20260725120000_webhook_events_monitoring.sql).",
      fetchedAt: new Date().toISOString(),
    };
  }
  if (firstError) throw new Error(firstError.message);

  const { providers, totals } = foldStats(
    (statsRes.data ?? []) as StatRow[],
    filters.provider
  );

  const timeline: TimelineBucket[] = ((timelineRes.data ?? []) as TimelineRow[]).map((b) => ({
    start: b.bucket_start,
    total: Number(b.total_count) || 0,
    processed: Number(b.processed_count) || 0,
    ignored: Number(b.ignored_count) || 0,
    failed: Number(b.failed_count) || 0,
    pending: Number(b.pending_count) || 0,
    unknown: Number(b.unknown_count) || 0,
  }));

  const rows = (eventsRes.data ?? []) as EventRow[];

  return {
    events: rows.map(mapEvent),
    totalMatching: rows.length > 0 ? Number(rows[0].wh_total_count) || 0 : 0,
    providers,
    timeline,
    totals,
    schemaError: null,
    fetchedAt: new Date().toISOString(),
  };
}

/** Pagination: the same filtered query, next page only. */
export async function fetchWebhookEventsPage(
  filters: WebhookFilters,
  offset: number
): Promise<{ events: WebhookEvent[]; totalMatching: number | null }> {
  await requireSuperAdmin();

  const supabase = adminClient();
  const { hours } = RANGES[filters.range] ?? RANGES["24h"];
  const since = new Date(Date.now() - hours * 3600_000).toISOString();

  const { data, error } = await supabase.rpc("admin_webhook_events", {
    p_since: since,
    p_provider: filters.provider,
    p_status: filters.status,
    p_search: filters.search?.trim() || null,
    p_limit: PAGE_SIZE,
    p_offset: offset,
  });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as EventRow[];
  return {
    events: rows.map(mapEvent),
    // An empty page carries no window count — leave the caller's total alone
    // rather than zeroing it and hiding the rows already on screen.
    totalMatching: rows.length > 0 ? Number(rows[0].wh_total_count) || 0 : null,
  };
}

/**
 * Re-run a stored payload through its handler. Useful after fixing a channel
 * that made events land as `ignored`, or after a transient failure.
 *
 * Not idempotent: only the Intelli/Instagram path dedupes by external message
 * id, so replaying an already-processed event can duplicate messages. The UI
 * warns before calling this.
 */
export async function replayWebhookEvent(
  id: string
): Promise<{ success: boolean; status?: string; message: string }> {
  await requireSuperAdmin();

  const supabase = adminClient();

  const { data: event, error } = await supabase
    .from("webhook_events")
    .select("id, provider, payload")
    .eq("id", id)
    .maybeSingle();

  if (error) return { success: false, message: error.message };
  if (!event) return { success: false, message: "Événement introuvable" };
  if (!event.payload) return { success: false, message: "Payload vide, rejeu impossible" };

  const startedAt = performance.now();

  // Intelli is the only ingress. Rows recorded as whatsapp/instagram predate
  // that and were delivered straight by Meta — there is no handler left to
  // replay them through, and inventing one would send a raw Meta envelope into
  // a parser that expects the normalized shape.
  if (event.provider !== "intelli") {
    return {
      success: false,
      message: `Événement « ${event.provider} » hérité de l'ancienne réception Meta directe — plus rejouable.`,
    };
  }

  try {
    const result = await processIntelliWebhook(
      supabase,
      event.payload as IntelliWebhookPayload
    );

    await finalizeWebhook(supabase, event.id, startedAt, result);

    return {
      success: true,
      status: result.status,
      message:
        result.status === "processed"
          ? `Rejoué — ${result.messages ?? 0} message(s) enregistré(s)`
          : `Rejoué — ignoré : ${result.reason ?? "sans raison"}`,
    };
  } catch (err) {
    const message = describeError(err);
    await finalizeWebhook(supabase, event.id, startedAt, { status: "failed", reason: message });
    return { success: false, status: "failed", message };
  }
}
