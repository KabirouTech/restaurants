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

function revalidateAnnouncements() {
    revalidatePath("/admin/announcements");
    revalidatePath("/dashboard");
}

function extractFormFields(formData: FormData) {
    return {
        message: formData.get("message") as string,
        type: (formData.get("type") as string) || "info",
        is_active: formData.get("is_active") === "true",
        dismissible: formData.get("dismissible") === "true",
        link_url: (formData.get("link_url") as string) || null,
        link_label: (formData.get("link_label") as string) || null,
        starts_at: (formData.get("starts_at") as string) || null,
        expires_at: (formData.get("expires_at") as string) || null,
        priority: parseInt(formData.get("priority") as string) || 0,
        emoji: (formData.get("emoji") as string) || null,
        animation: (formData.get("animation") as string) || "none",
        position: (formData.get("position") as string) || "top",
        display_format: (formData.get("display_format") as string) || "bar",
    };
}

export async function createAnnouncementAction(formData: FormData) {
    const admin = await verifySuperAdmin();
    const fields = extractFormFields(formData);

    if (!fields.message) return { error: "Le message est requis" };

    const { error } = await admin.from("platform_announcements").insert(fields);

    if (error) return { error: error.message };

    revalidateAnnouncements();
    return { success: true };
}

export async function updateAnnouncementAction(id: string, formData: FormData) {
    const admin = await verifySuperAdmin();
    const fields = extractFormFields(formData);

    if (!fields.message) return { error: "Le message est requis" };

    const { error } = await admin
        .from("platform_announcements")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidateAnnouncements();
    return { success: true };
}

export async function duplicateAnnouncementAction(id: string) {
    const admin = await verifySuperAdmin();

    const { data: source, error: fetchErr } = await admin
        .from("platform_announcements")
        .select("*")
        .eq("id", id)
        .single();

    if (fetchErr || !source) return { error: fetchErr?.message || "Annonce introuvable" };

    const { error } = await admin.from("platform_announcements").insert({
        message: `${source.message} (copie)`,
        type: source.type,
        is_active: false,
        dismissible: source.dismissible,
        link_url: source.link_url,
        link_label: source.link_label,
        starts_at: source.starts_at,
        expires_at: source.expires_at,
        priority: source.priority,
        emoji: source.emoji,
        animation: source.animation,
        position: source.position,
        display_format: source.display_format,
    });

    if (error) return { error: error.message };

    revalidateAnnouncements();
    return { success: true };
}

export async function deleteAnnouncementAction(id: string) {
    const admin = await verifySuperAdmin();

    const { error } = await admin
        .from("platform_announcements")
        .delete()
        .eq("id", id);

    if (error) return { error: error.message };

    revalidateAnnouncements();
    return { success: true };
}

export async function bulkDeleteAnnouncementsAction(ids: string[]) {
    const admin = await verifySuperAdmin();

    const { error } = await admin
        .from("platform_announcements")
        .delete()
        .in("id", ids);

    if (error) return { error: error.message };

    revalidateAnnouncements();
    return { success: true };
}

export async function bulkToggleAnnouncementsAction(ids: string[], isActive: boolean) {
    const admin = await verifySuperAdmin();

    const { error } = await admin
        .from("platform_announcements")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .in("id", ids);

    if (error) return { error: error.message };

    revalidateAnnouncements();
    return { success: true };
}
