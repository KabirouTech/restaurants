"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateSettingsAction(formData: FormData) {
    console.log("updateSettingsAction called with formData");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Non authentifié" };

    try {
        const orgId = formData.get("orgId") as string;
        const name = formData.get("name") as string;
        const rawSlug = formData.get("slug") as string;
        const description = formData.get("description") as string;
        const heroImage = formData.get("heroImage") as string;
        const heroTitle = formData.get("heroTitle") as string;
        const heroSubtitle = formData.get("heroSubtitle") as string;
        const contactPhone = formData.get("phone") as string;
        const contactEmail = formData.get("email") as string;
        const contactAddress = formData.get("address") as string;
        const primaryColor = formData.get("primaryColor") as string;

        // Validate Slug
        const slug = rawSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        if (!slug || slug.length < 3) {
            return { error: "Le slug doit contenir au moins 3 caractères valides (a-z, 0-9, -)." };
        }

        // Fetch existing settings to merge
        const { data: existingOrg } = await supabase
            .from("organizations")
            .select("settings, slug")
            .eq("id", orgId)
            .single();

        // Use Admin Client for updates (bypass RLS to allow slug changes)
        const { createClient: createAdminClient } = await import("@supabase/supabase-js");
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        // Check if slug is taken (only if changed)
        if (slug !== existingOrg?.slug) {
            const { data: slugCheck } = await supabaseAdmin
                .from("organizations")
                .select("id")
                .eq("slug", slug)
                .neq("id", orgId) // Exclude current org
                .maybeSingle();

            if (slugCheck) {
                return { error: `L'adresse "/${slug}" est déjà prise par une autre boutique. Veuillez en choisir une autre.` };
            }
        }

        const currentSettings = existingOrg?.settings || {};

        const newSettings = {
            ...currentSettings,
            description,
            hero_image: heroImage,
            hero_title: heroTitle,
            hero_subtitle: heroSubtitle,
            contact_phone: contactPhone,
            contact_email: contactEmail,
            contact_address: contactAddress,
            primary_color: primaryColor,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabaseAdmin
            .from("organizations")
            .update({
                name,
                slug,
                settings: newSettings,
            })
            .eq("id", orgId);

        if (error) {
            console.error("Error updating settings:", error);
            return { error: "Erreur: " + error.message };
        }

        revalidatePath("/dashboard/settings");
        if (existingOrg?.slug) {
            try {
                revalidatePath(`/${existingOrg.slug}`);
            } catch (e) {
                // Ignore if path doesn't exist yet
            }
        }
        if (slug && slug !== existingOrg?.slug) {
            try {
                revalidatePath(`/${slug}`);
            } catch (e) {
                // Ignore
            }
        }

        return { success: true };
    } catch (e: any) {
        console.error("Unexpected error in updateSettingsAction:", e);
        return { error: e.message || "Une erreur inattendue est survenue" };
    }
}
