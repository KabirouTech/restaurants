"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireSuperAdminAction } from "@/lib/auth/super-admin";

async function verifySuperAdmin() {
    const { userId } = await requireSuperAdminAction();

    return {
        admin: createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        ),
        userId,
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
