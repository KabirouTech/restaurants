import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * WhatsApp messaging access & free-trial logic.
 *
 * Every organization gets a 7-day WhatsApp free trial that starts the first
 * time they activate WhatsApp (connect a channel — hosted Intelli signup or
 * manual Cloud API). While the trial is running, the unified inbox is fully
 * usable regardless of plan. When it ends, messaging is blocked for free orgs;
 * Premium/Enterprise orgs (including admin "gift premium") keep full access.
 *
 * State is derived on read from `organizations.subscription_plan` and the trial
 * timestamps stored in `organizations.settings` (same JSONB convention as the
 * existing `premium_gift_*` grant) — no background job is needed to expire it.
 */

export const WHATSAPP_TRIAL_DAYS = 7;

const TRIAL_STARTED_KEY = "whatsapp_trial_started_at";
const TRIAL_ENDS_KEY = "whatsapp_trial_ends_at";

export type WhatsAppAccessState =
  | "none" // never activated WhatsApp yet — nothing to block
  | "trial" // inside the free-trial window
  | "active" // unlocked by a paid plan (premium/enterprise/gift)
  | "expired"; // trial window has passed and plan is free

export interface WhatsAppAccess {
  state: WhatsAppAccessState;
  /** Whether the messaging UI / sending should be permitted. */
  allowed: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  /** Whole days remaining in the trial (0 when expired/not-on-trial). */
  daysLeft: number;
}

type OrgRow = {
  subscription_plan?: string | null;
  settings?: Record<string, unknown> | null;
};

const PAID_PLANS = new Set(["premium", "enterprise"]);

/** Pure derivation — safe to call from server components after fetching the org. */
export function deriveWhatsAppAccess(org: OrgRow | null | undefined): WhatsAppAccess {
  const plan = org?.subscription_plan || "free";
  const settings = (org?.settings || {}) as Record<string, unknown>;
  const startedAt = (settings[TRIAL_STARTED_KEY] as string) || null;
  const endsAt = (settings[TRIAL_ENDS_KEY] as string) || null;

  // Paid plans always have full access (premium gift sets subscription_plan).
  if (PAID_PLANS.has(plan)) {
    return { state: "active", allowed: true, trialStartedAt: startedAt, trialEndsAt: endsAt, daysLeft: 0 };
  }

  // Free plan: gate on the trial window.
  if (startedAt && endsAt) {
    const endsMs = new Date(endsAt).getTime();
    const now = Date.now();
    if (Number.isFinite(endsMs) && now < endsMs) {
      const daysLeft = Math.max(0, Math.ceil((endsMs - now) / (24 * 60 * 60 * 1000)));
      return { state: "trial", allowed: true, trialStartedAt: startedAt, trialEndsAt: endsAt, daysLeft };
    }
    return { state: "expired", allowed: false, trialStartedAt: startedAt, trialEndsAt: endsAt, daysLeft: 0 };
  }

  // Never activated WhatsApp — let them in so they can connect & start the trial.
  return { state: "none", allowed: true, trialStartedAt: null, trialEndsAt: null, daysLeft: 0 };
}

/** Fetch the org and derive its WhatsApp access in one call (admin client). */
export async function getWhatsAppAccess(
  admin: SupabaseClient,
  organizationId: string
): Promise<WhatsAppAccess> {
  const { data: org } = await admin
    .from("organizations")
    .select("subscription_plan, settings")
    .eq("id", organizationId)
    .single();
  return deriveWhatsAppAccess(org);
}

/**
 * Start the 7-day trial the first time WhatsApp is activated for an org.
 * Idempotent: if the trial was already started (or the org is already paid),
 * the existing window is preserved. Returns the resulting trial end date.
 */
export async function startWhatsAppTrialIfNeeded(
  admin: SupabaseClient,
  organizationId: string
): Promise<{ trialEndsAt: string | null }> {
  const { data: org } = await admin
    .from("organizations")
    .select("settings")
    .eq("id", organizationId)
    .single();

  const settings = (org?.settings || {}) as Record<string, unknown>;
  const existingEnds = settings[TRIAL_ENDS_KEY] as string | undefined;
  if (existingEnds) {
    // Trial already started — don't reset the clock on reconnects.
    return { trialEndsAt: existingEnds };
  }

  const now = new Date();
  const ends = new Date(now.getTime() + WHATSAPP_TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const { error } = await admin
    .from("organizations")
    .update({
      settings: {
        ...settings,
        [TRIAL_STARTED_KEY]: now.toISOString(),
        [TRIAL_ENDS_KEY]: ends.toISOString(),
      },
    })
    .eq("id", organizationId);

  if (error) return { trialEndsAt: null };
  return { trialEndsAt: ends.toISOString() };
}
