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

export async function createAnnouncementAction(formData: FormData) {
    const admin = await verifySuperAdmin();

    const message = formData.get("message") as string;
    const type = formData.get("type") as string;
    const is_active = formData.get("is_active") === "true";
    const dismissible = formData.get("dismissible") === "true";

    if (!message) return { error: "Le message est requis" };

    const { error } = await admin.from("platform_announcements").insert({
        message,
        type: type || "info",
        is_active,
        dismissible,
    });

    if (error) return { error: error.message };

    revalidatePath("/admin/announcements");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function updateAnnouncementAction(id: string, formData: FormData) {
    const admin = await verifySuperAdmin();

    const message = formData.get("message") as string;
    const type = formData.get("type") as string;
    const is_active = formData.get("is_active") === "true";
    const dismissible = formData.get("dismissible") === "true";

    if (!message) return { error: "Le message est requis" };

    const { error } = await admin
        .from("platform_announcements")
        .update({
            message,
            type: type || "info",
            is_active,
            dismissible,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/announcements");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function deleteAnnouncementAction(id: string) {
    const admin = await verifySuperAdmin();

    const { error } = await admin
        .from("platform_announcements")
        .delete()
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/announcements");
    revalidatePath("/dashboard");
    return { success: true };
}
