"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function updateSettingsAction(formData: FormData) {
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
        const primaryColor = formData.get("primaryColor") as string;
        const logoUrl = formData.get("logoUrl") as string;
        const currency = formData.get("currency") as string;

        // Contact
        const contactPhone = formData.get("phone") as string;
        const contactEmail = formData.get("email") as string;
        const contactAddress = formData.get("address") as string;

        // Social
        const instagram = formData.get("instagram") as string;
        const facebook = formData.get("facebook") as string;
        const twitter = formData.get("twitter") as string;

        // SEO
        const metaTitle = formData.get("metaTitle") as string;
        const metaDescription = formData.get("metaDescription") as string;

        // Slug validation
        const slug = rawSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
        if (!slug || slug.length < 3) {
            return { error: "Le slug doit contenir au moins 3 caractères valides (a-z, 0-9, -)." };
        }

        // Fetch existing org
        const { data: existingOrg } = await supabase
            .from("organizations")
            .select("settings, slug")
            .eq("id", orgId)
            .single();

        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        // Slug uniqueness check
        if (slug !== existingOrg?.slug) {
            const { data: slugCheck } = await supabaseAdmin
                .from("organizations")
                .select("id")
                .eq("slug", slug)
                .neq("id", orgId)
                .maybeSingle();
            if (slugCheck) {
                return { error: `L'adresse "/${slug}" est déjà prise. Veuillez en choisir une autre.` };
            }
        }

        const currentSettings = (existingOrg?.settings || {}) as Record<string, any>;

        const newSettings: Record<string, any> = {
            ...currentSettings,
            description: description || null,
            hero_image: heroImage || null,
            hero_title: heroTitle || null,
            hero_subtitle: heroSubtitle || null,
            primary_color: primaryColor || "#f4af25",
            logo_url: logoUrl || null,
            currency: currency || "EUR",
            contact_phone: contactPhone || null,
            contact_email: contactEmail || null,
            contact_address: contactAddress || null,
            social_instagram: instagram || null,
            social_facebook: facebook || null,
            social_twitter: twitter || null,
            meta_title: metaTitle || null,
            meta_description: metaDescription || null,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabaseAdmin
            .from("organizations")
            .update({ name, slug, settings: newSettings })
            .eq("id", orgId);

        if (error) return { error: "Erreur: " + error.message };

        revalidatePath("/dashboard/settings");
        revalidatePath(`/${existingOrg?.slug || slug}`);
        if (slug !== existingOrg?.slug) revalidatePath(`/${slug}`);

        return { success: true };

    } catch (e: any) {
        console.error("updateSettingsAction:", e);
        return { error: e.message || "Erreur inattendue" };
    }
}
