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

function revalidateTutorialPaths() {
    revalidatePath("/admin/tutorials");
    revalidatePath("/tutoriels");
    revalidatePath("/");
}

export async function createTutorialAction(formData: FormData) {
    const admin = await verifySuperAdmin();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const embed_code = formData.get("embed_code") as string;
    const is_active = formData.get("is_active") === "true";
    const is_featured = formData.get("is_featured") === "true";
    const sort_order = parseInt(formData.get("sort_order") as string) || 0;

    if (!title) return { error: "Le titre est requis" };
    if (!embed_code) return { error: "Le code embed est requis" };

    // If featured, reset others
    if (is_featured) {
        await admin
            .from("platform_tutorials")
            .update({ is_featured: false })
            .eq("is_featured", true);
    }

    const { error } = await admin.from("platform_tutorials").insert({
        title,
        description: description || null,
        embed_code,
        is_active,
        is_featured,
        sort_order,
    });

    if (error) return { error: error.message };

    revalidateTutorialPaths();
    return { success: true };
}

export async function updateTutorialAction(id: string, formData: FormData) {
    const admin = await verifySuperAdmin();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const embed_code = formData.get("embed_code") as string;
    const is_active = formData.get("is_active") === "true";
    const is_featured = formData.get("is_featured") === "true";
    const sort_order = parseInt(formData.get("sort_order") as string) || 0;

    if (!title) return { error: "Le titre est requis" };
    if (!embed_code) return { error: "Le code embed est requis" };

    // If featured, reset others
    if (is_featured) {
        await admin
            .from("platform_tutorials")
            .update({ is_featured: false })
            .neq("id", id);
    }

    const { error } = await admin
        .from("platform_tutorials")
        .update({
            title,
            description: description || null,
            embed_code,
            is_active,
            is_featured,
            sort_order,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidateTutorialPaths();
    return { success: true };
}

export async function deleteTutorialAction(id: string) {
    const admin = await verifySuperAdmin();

    const { error } = await admin
        .from("platform_tutorials")
        .delete()
        .eq("id", id);

    if (error) return { error: error.message };

    revalidateTutorialPaths();
    return { success: true };
}

export async function bulkDeleteTutorialsAction(ids: string[]) {
    const admin = await verifySuperAdmin();

    const { error } = await admin
        .from("platform_tutorials")
        .delete()
        .in("id", ids);

    if (error) return { error: error.message };

    revalidateTutorialPaths();
    return { success: true };
}
