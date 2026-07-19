"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Webhook } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WebhookEventRow {
  id: string;
  provider: string | null;
  status: string | null;
  error_log: string | null;
  created_at: string | null;
  /** event type pulled out of the payload (e.g. message.received) */
  event: string | null;
  payload: unknown;
}

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  error: "bg-red-100 text-red-700",
};

/**
 * Read-only inspector for the most recent rows of `webhook_events`. Each row
 * expands to reveal the raw normalized payload Intelli forwarded.
 */
export function IntelliWebhooksViewer({ events }: { events: WebhookEventRow[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
        <Webhook className="h-6 w-6 mx-auto mb-2 opacity-40" />
        Aucun webhook reçu pour l’instant.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm divide-y divide-border">
      {events.map((ev) => (
        <WebhookRow key={ev.id} ev={ev} />
      ))}
    </div>
  );
}

function WebhookRow({ ev }: { ev: WebhookEventRow }) {
  const [open, setOpen] = useState(false);
  const statusColor = STATUS_COLOR[ev.status || ""] || "bg-slate-100 text-slate-600";

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold uppercase shrink-0">
          {ev.provider || "—"}
        </span>
        <span className="font-mono text-xs flex-1 min-w-0 truncate">
          {ev.event || "événement inconnu"}
        </span>
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0", statusColor)}>
          {ev.status || "—"}
        </span>
        <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:block">
          {ev.created_at ? new Date(ev.created_at).toLocaleString("fr-FR") : "—"}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          {ev.error_log && (
            <p className="text-xs text-red-600 mb-2 font-mono">{ev.error_log}</p>
          )}
          <pre className="max-h-80 overflow-auto rounded-lg bg-muted/40 border border-border p-3 text-[11px] font-mono leading-relaxed">
            {JSON.stringify(ev.payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
