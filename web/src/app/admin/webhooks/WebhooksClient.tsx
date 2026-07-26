"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Filter,
  Inbox,
  Link2,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Webhook,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { fetchWebhookDashboard, fetchWebhookEventsPage, replayWebhookEvent } from "./actions";
import {
  PAGE_SIZE,
  RANGES,
  LIVE_WEBHOOK_PROVIDERS,
  WEBHOOK_STATUSES,
  type RangeKey,
  type WebhookDashboard,
  type WebhookEvent,
  type WebhookFilters,
} from "./types";

/* ── Vocabulary ───────────────────────────────────────────────────────────── */

const STATUS_META: Record<
  string,
  { label: string; badge: string; dot: string; bar: string; help: string }
> = {
  processed: {
    label: "Traité",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    dot: "bg-green-500",
    bar: "bg-green-500",
    help: "Le message a été enregistré dans une conversation.",
  },
  ignored: {
    label: "Ignoré",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-400",
    bar: "bg-slate-400",
    help: "Reçu puis écarté volontairement (accusé de statut, écho, canal inconnu…).",
  },
  failed: {
    label: "Échec",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    dot: "bg-red-500",
    bar: "bg-red-500",
    help: "Le traitement a levé une erreur. Le message n'est pas arrivé dans la boîte.",
  },
  pending: {
    label: "En attente",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    help: "Reçu mais jamais clôturé — traitement interrompu (crash ou timeout).",
  },
  unknown: {
    label: "Inconnu",
    badge: "bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400",
    dot: "bg-slate-300 dark:bg-slate-600",
    bar: "bg-slate-300 dark:bg-slate-600",
    help: "Reçu avant l'instrumentation : l'issue n'a jamais été enregistrée.",
  },
};

/** Order used for stacked bars and progress segments, worst-on-top. */
const STACK_ORDER = ["processed", "ignored", "unknown", "pending", "failed"] as const;

const PROVIDER_META: Record<string, { label: string; accent: string; endpoint: string }> = {
  intelli: {
    label: "Intelli",
    accent: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    endpoint: "/api/webhooks/intelli",
  },
  // Legacy providers: rows exist, but the endpoints that produced them are gone.
  whatsapp: {
    label: "WhatsApp",
    accent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    endpoint: "",
  },
  instagram: {
    label: "Instagram",
    accent: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
    endpoint: "",
  },
};

const statusMeta = (s: string) => STATUS_META[s] ?? STATUS_META.pending;
const providerMeta = (p: string) =>
  PROVIDER_META[p] ?? { label: p, accent: "bg-muted text-muted-foreground", endpoint: "" };

const REFRESH_MS = 10_000;

/* ── Formatting ───────────────────────────────────────────────────────────── */

const relative = (iso: string | null) =>
  iso ? formatDistanceToNowStrict(new Date(iso), { locale: fr, addSuffix: true }) : "—";

const absolute = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

const duration = (ms: number | null) =>
  ms == null ? "—" : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;

/* ── Component ────────────────────────────────────────────────────────────── */

export function WebhooksClient({
  initialData,
  initialFilters,
  baseUrl,
}: {
  initialData: WebhookDashboard;
  initialFilters: WebhookFilters;
  baseUrl: string;
}) {
  const [filters, setFilters] = useState<WebhookFilters>(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.search);
  const [data, setData] = useState<WebhookDashboard>(initialData);
  const [events, setEvents] = useState<WebhookEvent[]>(initialData.events);
  const [totalMatching, setTotalMatching] = useState(initialData.totalMatching);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [replayTarget, setReplayTarget] = useState<WebhookEvent | null>(null);

  // Ref so the polling interval always reads the live filters without being
  // torn down and rebuilt on every keystroke.
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const load = useCallback(async (next: WebhookFilters, { silent = false } = {}) => {
    if (!silent) setRefreshing(true);
    try {
      const fresh = await fetchWebhookDashboard(next);
      setData(fresh);
      setEvents(fresh.events);
      setTotalMatching(fresh.totalMatching);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chargement impossible");
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  /* Debounced search — the payload scan is the expensive filter, don't fire it
     on every keystroke. */
  useEffect(() => {
    if (searchInput === filters.search) return;
    const t = setTimeout(() => {
      const next = { ...filtersRef.current, search: searchInput };
      setFilters(next);
      void load(next);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, filters.search, load]);

  /* Live polling. Paused while a row is expanded so the payload you're reading
     doesn't get pulled out from under you. */
  useEffect(() => {
    if (!autoRefresh || expanded.size > 0) return;
    const id = setInterval(() => void load(filtersRef.current, { silent: true }), REFRESH_MS);
    return () => clearInterval(id);
  }, [autoRefresh, expanded.size, load]);

  function applyFilters(patch: Partial<WebhookFilters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    if (patch.search !== undefined) setSearchInput(patch.search);
    void load(next);
  }

  function toggleStatus(status: string) {
    applyFilters({ status: filters.status === status ? null : status });
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const page = await fetchWebhookEventsPage(filters, events.length);
      setEvents((prev) => [...prev, ...page.events]);
      if (page.totalMatching !== null) setTotalMatching(page.totalMatching);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chargement impossible");
    } finally {
      setLoadingMore(false);
    }
  }

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function confirmReplay() {
    if (!replayTarget) return;
    const target = replayTarget;
    setReplayTarget(null);
    const result = await replayWebhookEvent(target.id);
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
    void load(filters, { silent: true });
  }

  const { totals } = data;
  const failureRate = totals.total > 0 ? (totals.failed / totals.total) * 100 : 0;
  const stuck = totals.pending;
  const hasFilters = Boolean(filters.provider || filters.status || filters.search);
  const hasMore = events.length < totalMatching;

  // Always show the live ingress; add legacy providers only while their rows
  // are still inside the selected window.
  const shownProviders = useMemo(() => {
    const names = new Set<string>(LIVE_WEBHOOK_PROVIDERS);
    data.providers.filter((p) => p.total > 0).forEach((p) => names.add(p.provider));
    return [...names];
  }, [data.providers]);

  const kpis = useMemo(
    () =>
      [
        { key: null, label: "Reçus", value: totals.total, dot: "bg-orange-500" },
        { key: "processed", label: "Traités", value: totals.processed, dot: STATUS_META.processed.dot },
        { key: "ignored", label: "Ignorés", value: totals.ignored, dot: STATUS_META.ignored.dot },
        { key: "failed", label: "Échecs", value: totals.failed, dot: STATUS_META.failed.dot },
        { key: "pending", label: "En attente", value: totals.pending, dot: STATUS_META.pending.dot },
        // Pre-instrumentation rows: only worth a slot once some exist.
        ...(totals.unknown > 0
          ? [{ key: "unknown", label: "Inconnus", value: totals.unknown, dot: STATUS_META.unknown.dot }]
          : []),
      ] as const,
    [totals]
  );

  return (
    <div className="flex flex-col min-h-full bg-background text-foreground">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur border-b border-border px-4 md:px-8 py-3 md:py-4 flex flex-wrap items-center gap-3 justify-between">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold font-serif flex items-center gap-2">
            <Webhook className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
            Webhooks
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                autoRefresh ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40"
              )}
            />
            {autoRefresh ? "Live" : "En pause"} · dernier événement {relative(totals.lastAt)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Range picker */}
          <div className="flex rounded-lg border border-border bg-card p-0.5">
            {(Object.keys(RANGES) as RangeKey[]).map((key) => (
              <button
                key={key}
                onClick={() => applyFilters({ range: key })}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                  filters.range === key
                    ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {RANGES[key].label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh((v) => !v)}
            className={cn("h-8 gap-1.5", autoRefresh && "border-green-500/40 text-green-600 dark:text-green-400")}
            title={autoRefresh ? "Désactiver le rafraîchissement auto" : "Rafraîchir toutes les 10 s"}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", autoRefresh ? "bg-green-500" : "bg-muted-foreground/40")} />
            <span className="hidden sm:inline">Live</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => void load(filters)}
            disabled={refreshing}
            title="Rafraîchir"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          </Button>
        </div>
      </header>

      <div className="p-4 md:p-8 space-y-6 w-full max-w-7xl">
        {data.schemaError && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Base de données pas à jour</p>
              <p className="text-muted-foreground">{data.schemaError}</p>
            </div>
          </div>
        )}

        {/* ── KPIs ─────────────────────────────────────────────────────── */}
        <section
          className={cn(
            "grid grid-cols-2 md:grid-cols-3 gap-3",
            kpis.length > 5 ? "lg:grid-cols-6" : "lg:grid-cols-5"
          )}
        >
          {kpis.map((kpi) => {
            const active = filters.status === kpi.key;
            return (
              <button
                key={kpi.label}
                onClick={() => (kpi.key ? toggleStatus(kpi.key) : applyFilters({ status: null }))}
                className={cn(
                  "bg-card rounded-xl border p-4 text-left transition-all hover:shadow-md",
                  active ? "border-orange-500/60 ring-1 ring-orange-500/20" : "border-border shadow-sm"
                )}
              >
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full", kpi.dot)} />
                  {kpi.label}
                </p>
                <p className="text-2xl font-bold font-serif mt-1">{kpi.value.toLocaleString("fr-FR")}</p>
                {kpi.label === "Échecs" && totals.total > 0 && (
                  <p className={cn("text-[11px] mt-0.5", failureRate > 1 ? "text-red-500" : "text-muted-foreground")}>
                    {failureRate.toFixed(1)} % du volume
                  </p>
                )}
                {kpi.label === "Reçus" && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    latence moy. {duration(totals.avgMs)}
                  </p>
                )}
              </button>
            );
          })}
        </section>

        {/* Actionable warnings — the two states that mean "go look now". */}
        {(totals.failed > 0 || stuck > 0) && (
          <div className="flex flex-col sm:flex-row gap-3">
            {totals.failed > 0 && (
              <button
                onClick={() => toggleStatus("failed")}
                className="flex-1 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-left hover:bg-red-500/10 transition-colors"
              >
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-sm">
                  <span className="font-semibold">{totals.failed} échec{totals.failed > 1 ? "s" : ""}</span>
                  <span className="text-muted-foreground"> — message non livré dans la boîte de réception.</span>
                </p>
              </button>
            )}
            {stuck > 0 && (
              <button
                onClick={() => toggleStatus("pending")}
                className="flex-1 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-left hover:bg-amber-500/10 transition-colors"
              >
                <Loader2 className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-sm">
                  <span className="font-semibold">{stuck} en attente</span>
                  <span className="text-muted-foreground"> — traitement jamais clôturé (crash ou timeout).</span>
                </p>
              </button>
            )}
          </div>
        )}

        {/* ── Volume chart ─────────────────────────────────────────────── */}
        <Timeline data={data} range={filters.range} />

        {/* ── Per-provider health ──────────────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {shownProviders.map((provider) => {
            const stat = data.providers.find((p) => p.provider === provider);
            const meta = providerMeta(provider);
            const active = filters.provider === provider;
            const total = stat?.total ?? 0;
            const failed = stat?.failed ?? 0;

            return (
              // The copy-endpoint control has to live outside the filter button
              // — a button can't nest inside a button.
              <div
                key={provider}
                className={cn(
                  "relative bg-card rounded-xl border transition-all",
                  active ? "border-orange-500/60 ring-1 ring-orange-500/20" : "border-border shadow-sm"
                )}
              >
                <div className="absolute top-4 right-4 z-10">
                  {meta.endpoint && (
                    <CopyButton
                      value={`${baseUrl}${meta.endpoint}`}
                      label="URL"
                      icon={<Link2 className="h-3 w-3" />}
                    />
                  )}
                </div>

                <button
                  onClick={() => applyFilters({ provider: active ? null : provider })}
                  className="w-full text-left p-4 rounded-xl hover:bg-muted/30 transition-colors"
                  title={active ? "Retirer le filtre" : `Filtrer sur ${meta.label}`}
                >
                  <div className="flex items-center gap-2 pr-16">
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase", meta.accent)}>
                      {meta.label}
                    </span>
                    {failed > 0 && (
                      <span className="text-[10px] font-semibold text-red-500">
                        {failed} échec{failed > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  <p className="text-xl font-bold font-serif mt-2">{total.toLocaleString("fr-FR")}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {total === 0
                      ? "aucun événement sur la période"
                      : `${stat?.processed ?? 0} traités · ${stat?.ignored ?? 0} ignorés · p95 ${duration(stat?.p95Ms ?? null)}`}
                  </p>

                  {total > 0 && (
                    <div className="mt-3 h-1.5 rounded-full overflow-hidden bg-muted flex">
                      {STACK_ORDER.map((k) => {
                        const value = stat?.[k] ?? 0;
                        if (value === 0) return null;
                        return (
                          <div
                            key={k}
                            className={statusMeta(k).bar}
                            style={{ width: `${(value / total) * 100}%` }}
                            title={`${statusMeta(k).label}: ${value}`}
                          />
                        );
                      })}
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground mt-2">
                    Dernier · {relative(stat?.lastAt ?? null)}
                  </p>
                </button>
              </div>
            );
          })}
        </section>

        {/* ── Filters + event stream ───────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Rechercher : numéro, message id, erreur, organisation…"
                className="w-full h-9 pl-9 pr-8 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-orange-500/40"
              />
              {searchInput && (
                <button
                  onClick={() => applyFilters({ search: "" })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {WEBHOOK_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  title={statusMeta(s).help}
                  className={cn(
                    "px-2.5 h-9 rounded-lg border text-xs font-medium transition-colors inline-flex items-center gap-1.5",
                    filters.status === s
                      ? "border-orange-500/60 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", statusMeta(s).dot)} />
                  {statusMeta(s).label}
                </button>
              ))}

              {hasFilters && (
                <button
                  onClick={() => applyFilters({ provider: null, status: null, search: "" })}
                  className="px-2.5 h-9 rounded-lg border border-border bg-card text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
                >
                  <X className="h-3 w-3" />
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="inline-flex items-center gap-1.5">
              <Filter className="h-3 w-3" />
              {totalMatching.toLocaleString("fr-FR")} événement{totalMatching > 1 ? "s" : ""}
              {hasFilters && " (filtré)"}
              {" · "}
              {RANGES[filters.range].label}
            </span>
            <span>Actualisé {relative(data.fetchedAt)}</span>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm divide-y divide-border">
            {events.length === 0 ? (
              <div className="p-12 text-center">
                <Inbox className="h-7 w-7 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {hasFilters
                    ? "Aucun événement ne correspond à ces filtres."
                    : "Aucun webhook reçu sur cette période."}
                </p>
              </div>
            ) : (
              events.map((ev) => (
                <EventRow
                  key={ev.id}
                  event={ev}
                  open={expanded.has(ev.id)}
                  onToggle={() => toggleExpanded(ev.id)}
                  onReplay={() => setReplayTarget(ev)}
                />
              ))
            )}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={() => void loadMore()} disabled={loadingMore}>
                {loadingMore ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 mr-2" />
                )}
                Charger {Math.min(PAGE_SIZE, totalMatching - events.length)} de plus
              </Button>
            </div>
          )}
        </section>
      </div>

      {/* ── Replay confirmation ──────────────────────────────────────────── */}
      <Dialog open={Boolean(replayTarget)} onOpenChange={(open) => !open && setReplayTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-orange-500" />
              Rejouer cet événement ?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Le payload sera repassé dans le handler{" "}
              <span className="font-medium text-foreground">{replayTarget?.provider}</span>, comme s&apos;il
              venait d&apos;arriver.
            </p>
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs">
                Le rejeu n&apos;est pas idempotent sur WhatsApp et Instagram (Meta direct) : si l&apos;événement
                avait déjà été traité, le message sera dupliqué dans la conversation. À réserver aux
                événements <strong>en échec</strong> ou <strong>ignorés</strong>.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplayTarget(null)}>
              Annuler
            </Button>
            <Button onClick={() => void confirmReplay()}>Rejouer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Volume chart ─────────────────────────────────────────────────────────── */

function Timeline({ data, range }: { data: WebhookDashboard; range: RangeKey }) {
  const max = Math.max(...data.timeline.map((b) => b.total), 1);
  const empty = data.timeline.every((b) => b.total === 0);

  const tickLabel = (iso: string) => {
    const d = new Date(iso);
    return range === "7d" || range === "30d"
      ? d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
      : d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <section className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <h2 className="text-sm font-semibold shrink-0">Volume reçu</h2>
        <div className="flex flex-wrap justify-end items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {STACK_ORDER.filter((s) => s !== "unknown" || data.timeline.some((b) => b.unknown > 0)).map(
            (s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-sm", statusMeta(s).bar)} />
                {statusMeta(s).label}
              </span>
            )
          )}
        </div>
      </div>

      {empty ? (
        <p className="h-28 flex items-center justify-center text-xs text-muted-foreground">
          Aucun trafic sur la période.
        </p>
      ) : (
        <>
          <div className="flex items-end gap-[2px] h-28">
            {data.timeline.map((bucket) => (
              <div
                key={bucket.start}
                className="flex-1 min-w-0 h-full flex flex-col justify-end group relative"
                title={`${tickLabel(bucket.start)} — ${bucket.total} événement(s) · ${STACK_ORDER.filter(
                  (s) => bucket[s] > 0
                )
                  .map((s) => `${bucket[s]} ${statusMeta(s).label.toLowerCase()}`)
                  .join(", ")}`}
              >
                {bucket.total === 0 ? (
                  <div className="h-[2px] rounded-sm bg-muted" />
                ) : (
                  <div
                    className="flex flex-col-reverse rounded-sm overflow-hidden transition-opacity group-hover:opacity-80"
                    style={{ height: `${Math.max((bucket.total / max) * 100, 4)}%` }}
                  >
                    {STACK_ORDER.map((s) => {
                      const value = bucket[s];
                      if (value === 0) return null;
                      return (
                        <div
                          key={s}
                          className={statusMeta(s).bar}
                          style={{ height: `${(value / bucket.total) * 100}%` }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
            <span>{tickLabel(data.timeline[0]?.start ?? new Date().toISOString())}</span>
            <span>maintenant</span>
          </div>
        </>
      )}
    </section>
  );
}

/* ── Event row ────────────────────────────────────────────────────────────── */

function EventRow({
  event,
  open,
  onToggle,
  onReplay,
}: {
  event: WebhookEvent;
  open: boolean;
  onToggle: () => void;
  onReplay: () => void;
}) {
  const status = statusMeta(event.status);
  const provider = providerMeta(event.provider);
  const json = useMemo(() => JSON.stringify(event.payload, null, 2), [event.payload]);

  return (
    <div className={cn(event.status === "failed" && "bg-red-500/[0.03]")}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 md:px-4 py-2.5 hover:bg-muted/40 transition-colors text-left"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}

        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase shrink-0 w-[76px] text-center", provider.accent)}>
          {provider.label}
        </span>

        <span className="font-mono text-xs flex-1 min-w-0 truncate">
          {event.eventType || <span className="text-muted-foreground italic">type inconnu</span>}
          {event.errorLog && (
            <span
              className={cn(
                "ml-2 font-sans not-italic",
                event.status === "failed" ? "text-red-500" : "text-muted-foreground"
              )}
            >
              — {event.errorLog}
            </span>
          )}
        </span>

        <span className="hidden lg:block text-[11px] text-muted-foreground shrink-0 max-w-[140px] truncate">
          {event.organizationName ?? "—"}
        </span>

        <span className="hidden md:block text-[11px] text-muted-foreground shrink-0 w-14 text-right tabular-nums">
          {duration(event.durationMs)}
        </span>

        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 w-[70px] text-center", status.badge)}>
          {status.label}
        </span>

        <span
          className="text-[11px] text-muted-foreground shrink-0 hidden sm:block w-24 text-right"
          title={absolute(event.createdAt)}
        >
          {relative(event.createdAt)}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 pl-9 space-y-3">
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
            <Detail label="Reçu" value={absolute(event.createdAt)} />
            <Detail label="Clôturé" value={absolute(event.processedAt)} />
            <Detail label="Durée" value={duration(event.durationMs)} />
            <Detail
              label="Organisation"
              value={
                event.organizationId ? (
                  <Link
                    href={`/admin/organizations/${event.organizationId}`}
                    className="text-orange-500 hover:underline"
                  >
                    {event.organizationName ?? event.organizationId.slice(0, 8)}
                  </Link>
                ) : (
                  "Non routé"
                )
              }
            />
          </dl>

          {event.errorLog && (
            <div
              className={cn(
                "rounded-lg border p-2.5 text-xs",
                event.status === "failed"
                  ? "border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400"
                  : "border-border bg-muted/40 text-muted-foreground"
              )}
            >
              {event.errorLog}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                Payload
              </span>
              <div className="flex items-center gap-1.5">
                <CopyButton value={json} label="JSON" icon={<Copy className="h-3 w-3" />} />
                <button
                  onClick={onReplay}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-orange-500 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Rejouer
                </button>
              </div>
            </div>
            <pre className="max-h-80 overflow-auto rounded-lg bg-muted/40 border border-border p-3 text-[11px] font-mono leading-relaxed">
              {json}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="uppercase tracking-wider font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground truncate">{value}</dd>
    </div>
  );
}

function CopyButton({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Copie impossible");
        }
      }}
      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      title={`Copier ${label}`}
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : icon}
      {copied ? "Copié" : label}
    </button>
  );
}
