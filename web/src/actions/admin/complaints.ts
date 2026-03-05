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

    return {
        admin: createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        ),
        userId: user.id,
    };
}

export async function updateComplaintStatusAction(
    complaintId: string,
    status: "in_progress" | "resolved" | "closed",
    adminNotes?: string,
) {
    const { admin, userId } = await verifySuperAdmin();

    const update: Record<string, unknown> = {
        status,
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString(),
    };

    if (status === "resolved" || status === "closed") {
        update.resolved_by = userId;
        update.resolved_at = new Date().toISOString();
    }

    const { error } = await admin
        .from("complaints")
        .update(update)
        .eq("id", complaintId);

    if (error) return { error: error.message };

    revalidatePath("/admin/complaints");
    return { success: true };
}
