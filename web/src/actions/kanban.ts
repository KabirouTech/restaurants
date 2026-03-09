"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export async function updateOrderStatusAction(orderId: string, newStatus: string) {
    const { userId, profile } = await getCurrentProfile();
    if (!userId) return { error: "Non authentifié" };
    if (!profile?.organization_id) return { error: "Organisation introuvable" };

    const supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId)
        .eq("organization_id", profile.organization_id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/orders");
    return { success: true };
}

export async function updateKanbanColumnsAction(columns: { id: string; label: string; color: string }[]) {
    const { userId, profile } = await getCurrentProfile();
    if (!userId) return { error: "Non authentifié" };
    if (!profile?.organization_id) return { error: "Organisation introuvable" };

    const supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Store columns config in organizations.settings
    const { data: org } = await supabase.from("organizations").select("settings").eq("id", profile.organization_id).single();
    const currentSettings = (org?.settings as Record<string, any>) || {};

    const { error } = await supabase
        .from("organizations")
        .update({ settings: { ...currentSettings, kanban_columns: columns } })
        .eq("id", profile.organization_id);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/orders");
    revalidatePath("/dashboard/settings");
    return { success: true };
}
