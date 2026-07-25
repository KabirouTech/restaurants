/** Shared shapes between the webhook monitor's server actions and its UI. */

export const WEBHOOK_STATUSES = [
  "processed",
  "ignored",
  "failed",
  "pending",
  "unknown",
] as const;
export type WebhookStatus = (typeof WEBHOOK_STATUSES)[number];

export const WEBHOOK_PROVIDERS = ["intelli", "whatsapp", "instagram"] as const;

/** Time windows offered in the header, with the chart bucket each implies. */
export const RANGES = {
  "1h": { label: "1 h", hours: 1, bucketMinutes: 5 },
  "24h": { label: "24 h", hours: 24, bucketMinutes: 60 },
  "7d": { label: "7 j", hours: 24 * 7, bucketMinutes: 360 },
  "30d": { label: "30 j", hours: 24 * 30, bucketMinutes: 1440 },
} as const;

export type RangeKey = keyof typeof RANGES;

export type WebhookEvent = {
  id: string;
  provider: string;
  status: string;
  eventType: string | null;
  errorLog: string | null;
  organizationId: string | null;
  organizationName: string | null;
  durationMs: number | null;
  createdAt: string;
  processedAt: string | null;
  payload: unknown;
};

export type ProviderStat = {
  provider: string;
  total: number;
  processed: number;
  ignored: number;
  failed: number;
  pending: number;
  unknown: number;
  avgMs: number | null;
  p95Ms: number | null;
  lastAt: string | null;
};

export type TimelineBucket = {
  start: string;
  total: number;
  processed: number;
  ignored: number;
  failed: number;
  pending: number;
  unknown: number;
};

export type WebhookFilters = {
  range: RangeKey;
  provider: string | null;
  status: string | null;
  search: string;
};

export type WebhookDashboard = {
  events: WebhookEvent[];
  totalMatching: number;
  providers: ProviderStat[];
  timeline: TimelineBucket[];
  /** Headline counts, narrowed to `filters.provider` when one is selected. */
  totals: {
    total: number;
    processed: number;
    ignored: number;
    failed: number;
    pending: number;
    unknown: number;
    avgMs: number | null;
    p95Ms: number | null;
    lastAt: string | null;
  };
  /** Set when the monitoring migration hasn't been applied to this database. */
  schemaError: string | null;
  fetchedAt: string;
};

export const PAGE_SIZE = 50;
