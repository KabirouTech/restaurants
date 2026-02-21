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

export async function createBannerAction(formData: FormData) {
    const admin = await verifySuperAdmin();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const image_url = formData.get("image_url") as string;
    const link_url = formData.get("link_url") as string;
    const is_active = formData.get("is_active") === "true";
    const start_date = formData.get("start_date") as string;
    const end_date = formData.get("end_date") as string;

    if (!title) return { error: "Le titre est requis" };

    const { error } = await admin.from("platform_banners").insert({
        title,
        description: description || null,
        image_url: image_url || null,
        link_url: link_url || null,
        is_active,
        start_date: start_date || null,
        end_date: end_date || null,
    });

    if (error) return { error: error.message };

    revalidatePath("/admin/banners");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function updateBannerAction(id: string, formData: FormData) {
    const admin = await verifySuperAdmin();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const image_url = formData.get("image_url") as string;
    const link_url = formData.get("link_url") as string;
    const is_active = formData.get("is_active") === "true";
    const start_date = formData.get("start_date") as string;
    const end_date = formData.get("end_date") as string;

    if (!title) return { error: "Le titre est requis" };

    const { error } = await admin
        .from("platform_banners")
        .update({
            title,
            description: description || null,
            image_url: image_url || null,
            link_url: link_url || null,
            is_active,
            start_date: start_date || null,
            end_date: end_date || null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/banners");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function deleteBannerAction(id: string) {
    const admin = await verifySuperAdmin();

    const { error } = await admin
        .from("platform_banners")
        .delete()
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/banners");
    revalidatePath("/dashboard");
    return { success: true };
}
