"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireSuperAdminAction } from "@/lib/auth/super-admin";

async function verifySuperAdmin() {
    await requireSuperAdminAction();

    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

export async function toggleOrgActiveAction(orgId: string, isActive: boolean) {
    const admin = await verifySuperAdmin();

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
    const admin = await verifySuperAdmin();

    const { error } = await admin
        .from("organizations")
        .update({ subscription_plan: plan })
        .eq("id", orgId);

    if (error) return { error: error.message };

    revalidatePath("/admin/organizations");
    revalidatePath(`/admin/organizations/${orgId}`);
    return { success: true };
}

export async function giftPremiumAction(orgId: string, days: number) {
    const admin = await verifySuperAdmin();

    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

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
                premium_gift_expires_at: expiresAt,
                premium_gift_days: days,
                premium_gifted_at: new Date().toISOString(),
            },
        })
        .eq("id", orgId);

    if (error) return { error: error.message };

    revalidatePath("/admin/organizations");
    revalidatePath(`/admin/organizations/${orgId}`);
    return { success: true, expiresAt };
}

export async function revokePremiumGiftAction(orgId: string) {
    const admin = await verifySuperAdmin();

    const { data: org } = await admin
        .from("organizations")
        .select("settings")
        .eq("id", orgId)
        .single();

    const currentSettings = (org?.settings || {}) as Record<string, any>;
    const { premium_gift, premium_gift_expires_at, premium_gift_days, premium_gifted_at, ...cleanSettings } = currentSettings;

    const { error } = await admin
        .from("organizations")
        .update({
            subscription_plan: "free",
            settings: cleanSettings,
        })
        .eq("id", orgId);

    if (error) return { error: error.message };

    revalidatePath("/admin/organizations");
    revalidatePath(`/admin/organizations/${orgId}`);
    return { success: true };
}

export async function bulkToggleOrgsActiveAction(ids: string[], isActive: boolean) {
    const admin = await verifySuperAdmin();

    const { error } = await admin
        .from("organizations")
        .update({ is_active: isActive })
        .in("id", ids);

    if (error) return { error: error.message };

    revalidatePath("/admin/organizations");
    return { success: true };
}
