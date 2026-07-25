-- Webhook monitoring: give `webhook_events` the columns the admin monitor needs
-- and the aggregates it reads. Until now rows were inserted as 'pending' and
-- never updated, so status/error_log carried no signal.
--
-- Status vocabulary written by the routes:
--   pending   — inserted, processing not finished (crash/timeout if it sticks)
--   processed — handler ran and produced conversation activity
--   ignored   — handler ran and deliberately dropped the event (see error_log)
--   failed    — handler threw (see error_log)
--   unknown   — pre-instrumentation row, outcome never recorded (backfill below)
--
-- Idempotent: safe to re-run.

ALTER TABLE webhook_events
    ADD COLUMN IF NOT EXISTS event_type TEXT,
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS duration_ms INTEGER;

COMMENT ON COLUMN webhook_events.event_type IS 'Event name lifted out of the payload (e.g. message.received, meta:whatsapp_business_account)';
COMMENT ON COLUMN webhook_events.organization_id IS 'Organization the event was routed to, once the channel is resolved. NULL when unroutable.';
COMMENT ON COLUMN webhook_events.duration_ms IS 'Wall-clock handler duration in milliseconds.';

-- The monitor always sorts by recency, usually narrowed by provider or status.
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at
    ON webhook_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_created_at
    ON webhook_events (provider, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_events_status_created_at
    ON webhook_events (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_events_organization_id
    ON webhook_events (organization_id)
    WHERE organization_id IS NOT NULL;


-- Every row written before this migration was inserted as 'pending' and never
-- updated, so its outcome is genuinely unknown — not stuck. Re-labelling them
-- keeps the "N en attente" alarm meaningful instead of permanently red.
-- The cutoff is a fixed literal (not NOW()), so re-running is a no-op and a
-- genuinely stuck post-deploy row is never swallowed.
UPDATE webhook_events
SET status = 'unknown'
WHERE (status IS NULL OR status = 'pending')
  AND processed_at IS NULL
  AND created_at < TIMESTAMPTZ '2026-07-25 12:00:00+00';


-- ── Aggregates ───────────────────────────────────────────────────────────────
-- Counting client-side would mean shipping every row to the app. These three
-- keep the dashboard to a fixed 3 queries regardless of volume.
-- Output columns are prefixed to avoid shadowing the table's own column names.

-- Grouped per provider AND per status, never pre-aggregated: the UI needs the
-- per-channel cards (all providers) and the headline KPIs (optionally narrowed
-- to one provider) from the same result set, so it folds this client-side.
CREATE OR REPLACE FUNCTION public.admin_webhook_stats(p_since TIMESTAMPTZ)
RETURNS TABLE (
    wh_provider TEXT,
    wh_status TEXT,
    event_count BIGINT,
    avg_ms NUMERIC,
    p95_ms NUMERIC,
    last_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        COALESCE(w.provider, 'unknown')::TEXT,
        COALESCE(w.status, 'pending')::TEXT,
        COUNT(*)::BIGINT,
        ROUND(AVG(w.duration_ms)::NUMERIC, 0),
        ROUND(
            (PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY w.duration_ms))::NUMERIC,
            0
        ),
        MAX(w.created_at)
    FROM webhook_events w
    WHERE w.created_at >= p_since
    GROUP BY 1, 2;
$$;

-- Volume over time, gap-filled so the chart keeps a stable number of bars even
-- across quiet periods.
CREATE OR REPLACE FUNCTION public.admin_webhook_timeline(
    p_since TIMESTAMPTZ,
    p_bucket_minutes INTEGER DEFAULT 60,
    p_provider TEXT DEFAULT NULL
)
RETURNS TABLE (
    bucket_start TIMESTAMPTZ,
    total_count BIGINT,
    processed_count BIGINT,
    ignored_count BIGINT,
    failed_count BIGINT,
    pending_count BIGINT,
    unknown_count BIGINT
)
LANGUAGE sql
STABLE
AS $$
    WITH step AS (
        SELECT MAKE_INTERVAL(mins => GREATEST(p_bucket_minutes, 1)) AS width
    ),
    series AS (
        SELECT GENERATE_SERIES(
            DATE_BIN(s.width, p_since, TIMESTAMPTZ 'epoch'),
            DATE_BIN(s.width, NOW(), TIMESTAMPTZ 'epoch'),
            s.width
        ) AS bucket_start
        FROM step s
    )
    SELECT
        b.bucket_start,
        COUNT(w.id)::BIGINT,
        COUNT(w.id) FILTER (WHERE w.status = 'processed')::BIGINT,
        COUNT(w.id) FILTER (WHERE w.status = 'ignored')::BIGINT,
        COUNT(w.id) FILTER (WHERE w.status = 'failed')::BIGINT,
        COUNT(w.id) FILTER (WHERE w.status IS NULL OR w.status = 'pending')::BIGINT,
        COUNT(w.id) FILTER (WHERE w.status = 'unknown')::BIGINT
    FROM series b
    CROSS JOIN step s
    LEFT JOIN webhook_events w
        ON w.created_at >= b.bucket_start
       AND w.created_at < b.bucket_start + s.width
       AND (p_provider IS NULL OR w.provider = p_provider)
    GROUP BY b.bucket_start
    ORDER BY b.bucket_start;
$$;

-- Filtered listing with the org name joined and the total count carried on each
-- row, so the table and its "N results" header stay one round-trip.
-- `p_search` scans the raw payload text as well (matching a phone number or a
-- message id is the whole point of the search box); the `created_at` bound
-- keeps that scan off the full table.
CREATE OR REPLACE FUNCTION public.admin_webhook_events(
    p_since TIMESTAMPTZ,
    p_provider TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    wh_id UUID,
    wh_provider TEXT,
    wh_status TEXT,
    wh_event_type TEXT,
    wh_error_log TEXT,
    wh_organization_id UUID,
    wh_organization_name TEXT,
    wh_duration_ms INTEGER,
    wh_created_at TIMESTAMPTZ,
    wh_processed_at TIMESTAMPTZ,
    wh_payload JSONB,
    wh_total_count BIGINT
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        w.id,
        COALESCE(w.provider, 'unknown')::TEXT,
        COALESCE(w.status, 'pending')::TEXT,
        w.event_type,
        w.error_log,
        w.organization_id,
        o.name,
        w.duration_ms,
        w.created_at,
        w.processed_at,
        w.payload,
        COUNT(*) OVER ()::BIGINT
    FROM webhook_events w
    LEFT JOIN organizations o ON o.id = w.organization_id
    WHERE w.created_at >= p_since
      AND (p_provider IS NULL OR w.provider = p_provider)
      AND (p_status IS NULL OR COALESCE(w.status, 'pending') = p_status)
      AND (
          p_search IS NULL
          OR p_search = ''
          OR w.event_type ILIKE '%' || p_search || '%'
          OR w.error_log ILIKE '%' || p_search || '%'
          OR o.name ILIKE '%' || p_search || '%'
          OR w.payload::TEXT ILIKE '%' || p_search || '%'
      )
    ORDER BY w.created_at DESC
    LIMIT GREATEST(LEAST(p_limit, 200), 1)
    OFFSET GREATEST(p_offset, 0);
$$;

-- Platform-admin surface only: read through the service role, never the browser.
REVOKE ALL ON FUNCTION public.admin_webhook_stats(TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_webhook_timeline(TIMESTAMPTZ, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_webhook_events(TIMESTAMPTZ, TEXT, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_webhook_stats(TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_webhook_timeline(TIMESTAMPTZ, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_webhook_events(TIMESTAMPTZ, TEXT, TEXT, TEXT, INTEGER, INTEGER) TO service_role;
