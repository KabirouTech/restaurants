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
