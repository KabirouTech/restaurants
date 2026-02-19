"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function updateOrderStatusAction(orderId: string, newStatus: string) {
    const supabaseUser = await createClient();
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const { data: profile } = await supabaseUser.from("profiles").select("organization_id").eq("id", user.id).single();
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
    const supabaseUser = await createClient();
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const { data: profile } = await supabaseUser.from("profiles").select("organization_id").eq("id", user.id).single();
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
