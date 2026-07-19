"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireSuperAdminAction } from "@/lib/auth/super-admin";

async function verifySuperAdmin() {
    const { profile } = await requireSuperAdminAction();

    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
    return { admin, profile };
}

export async function toggleOrgActiveAction(orgId: string, isActive: boolean) {
    const { admin } = await verifySuperAdmin();

    const { error } = await admin
        .from("organizations")
        .update({ is_active: isActive })
        .eq("id", orgId);

    if (error) return { error: error.message };

    revalidatePath("/admin/organizations");
    revalidatePath(`/admin/organizations/${orgId}`);
    return { success: true };
}

export async function changeOrgPlanAction(orgId: string, plan: string) {
    const { admin } = await verifySuperAdmin();

    const { error } = await admin
        .from("organizations")
        .update({ subscription_plan: plan })
        .eq("id", orgId);

    if (error) return { error: error.message };

    revalidatePath("/admin/organizations");
    revalidatePath(`/admin/organizations/${orgId}`);
    return { success: true };
}

/** Période d'un cadeau Premium : soit une durée en jours, soit une date de fin. */
export interface GiftPeriod {
    /** Durée en jours à partir de maintenant. */
    days?: number;
    /** Date de fin "YYYY-MM-DD" (incluse — expire en fin de journée UTC). */
    endsAt?: string;
}

const MAX_GIFT_DAYS = 730; // garde-fou : 2 ans max

function resolveGiftExpiry(period: GiftPeriod): { expiresAt: Date; days: number } | { error: string } {
    const now = Date.now();

    if (period.endsAt) {
        const expiresAt = new Date(`${period.endsAt}T23:59:59.999Z`);
        if (Number.isNaN(expiresAt.getTime())) {
            return { error: "Date de fin invalide." };
        }
        if (expiresAt.getTime() <= now) {
            return { error: "La date de fin doit être dans le futur." };
        }
        const days = Math.ceil((expiresAt.getTime() - now) / (24 * 60 * 60 * 1000));
        if (days > MAX_GIFT_DAYS) {
            return { error: `La période ne peut pas dépasser ${MAX_GIFT_DAYS} jours.` };
        }
        return { expiresAt, days };
    }

    const days = period.days ?? 0;
    if (!Number.isInteger(days) || days < 1 || days > MAX_GIFT_DAYS) {
        return { error: `Durée invalide (1 à ${MAX_GIFT_DAYS} jours).` };
    }
    return { expiresAt: new Date(now + days * 24 * 60 * 60 * 1000), days };
}

/**
 * Offrir le Premium à une organisation pour la période choisie — durée libre en
 * jours ou date de fin explicite. Ré-appeler sur une org déjà « giftée »
 * remplace la période (prolongation ou réduction).
 *
 * L'expiration est appliquée automatiquement par le job pg_cron
 * `expire-premium-gifts` (migration 20260719100000).
 */
export async function giftPremiumAction(orgId: string, period: GiftPeriod) {
    const { admin, profile } = await verifySuperAdmin();

    const resolved = resolveGiftExpiry(period);
    if ("error" in resolved) return { error: resolved.error };
    const { expiresAt, days } = resolved;

    const now = new Date();
    const expiresAtIso = expiresAt.toISOString();

    // Get current settings to merge
    const { data: org } = await admin
        .from("organizations")
        .select("settings")
        .eq("id", orgId)
        .single();

    const currentSettings = (org?.settings || {}) as Record<string, any>;

    const { error } = await admin
        .from("organizations")
        .update({
            subscription_plan: "premium",
            settings: {
                ...currentSettings,
                premium_gift: true,
                premium_gift_starts_at: now.toISOString(),
                premium_gift_expires_at: expiresAtIso,
                premium_gift_days: days,
                premium_gifted_at: now.toISOString(),
            },
        })
        .eq("id", orgId);

    if (error) return { error: error.message };

    // Refléter la période sur la ligne subscriptions (page admin Abonnements).
    // Non bloquant : organizations.subscription_plan reste la source de vérité.
    const { error: subError } = await admin
        .from("subscriptions")
        .upsert(
            {
                organization_id: orgId,
                plan_key: "premium",
                status: "active",
                current_period_start: now.toISOString(),
                current_period_end: expiresAtIso,
                updated_at: now.toISOString(),
            },
            { onConflict: "organization_id" }
        );
    if (subError) console.error("Gift premium: subscriptions sync failed:", subError);

    await admin.from("subscription_events").insert({
        organization_id: orgId,
        event_type: "premium_gift_granted",
        payload: { days, expires_at: expiresAtIso },
        created_by: profile?.id ?? null,
    });

    revalidatePath("/admin/organizations");
    revalidatePath(`/admin/organizations/${orgId}`);
    revalidatePath("/admin/subscriptions");
    return { success: true, expiresAt: expiresAtIso };
}

export async function revokePremiumGiftAction(orgId: string) {
    const { admin, profile } = await verifySuperAdmin();

    const { data: org } = await admin
        .from("organizations")
        .select("settings")
        .eq("id", orgId)
        .single();

    const currentSettings = (org?.settings || {}) as Record<string, any>;
    const {
        premium_gift,
        premium_gift_starts_at,
        premium_gift_expires_at,
        premium_gift_days,
        premium_gifted_at,
        ...cleanSettings
    } = currentSettings;

    const { error } = await admin
        .from("organizations")
        .update({
            subscription_plan: "free",
            settings: cleanSettings,
        })
        .eq("id", orgId);

    if (error) return { error: error.message };

    const { error: subError } = await admin
        .from("subscriptions")
        .update({
            plan_key: "free",
            status: "active",
            current_period_end: null,
            updated_at: new Date().toISOString(),
        })
        .eq("organization_id", orgId);
    if (subError) console.error("Revoke gift: subscriptions sync failed:", subError);

    await admin.from("subscription_events").insert({
        organization_id: orgId,
        event_type: "premium_gift_revoked",
        payload: { expires_at: premium_gift_expires_at ?? null },
        created_by: profile?.id ?? null,
    });

    revalidatePath("/admin/organizations");
    revalidatePath(`/admin/organizations/${orgId}`);
    revalidatePath("/admin/subscriptions");
    return { success: true };
}

export async function bulkToggleOrgsActiveAction(ids: string[], isActive: boolean) {
    const { admin } = await verifySuperAdmin();

    const { error } = await admin
        .from("organizations")
        .update({ is_active: isActive })
        .in("id", ids);

    if (error) return { error: error.message };

    revalidatePath("/admin/organizations");
    return { success: true };
}
