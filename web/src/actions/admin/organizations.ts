"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

async function verifySuperAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .single();

    if (!profile?.is_super_admin) throw new Error("Accès refusé");

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
