"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

interface SiteSettingsPayload {
    orgId: string;
    sections: any[];
    heroTitle?: string;
    heroSubtitle?: string;
    description?: string;
    heroImage?: string;
    aboutTitle: string;
    aboutSubtitle: string;
    aboutText1: string;
    aboutText2: string;
    aboutImage: string;
    stat1Value: string; stat1Label: string;
    stat2Value: string; stat2Label: string;
    stat3Value: string; stat3Label: string;
    servicesTitle: string;
    servicesSubtitle: string;
    services: any[];
    galleryTitle: string;
    gallerySubtitle: string;
    galleryImages: string[];
    testimonialsTitle: string;
    testimonialsSubtitle: string;
    testimonials: any[];
    contactTitle: string;
    contactSubtitle: string;
}

export async function updateSiteSettingsAction(payload: SiteSettingsPayload) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    try {
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        // Fetch existing settings to merge
        const { data: org } = await supabaseAdmin
            .from("organizations")
            .select("settings, slug")
            .eq("id", payload.orgId)
            .single();

        const current = (org?.settings || {}) as Record<string, any>;

        const newSettings: Record<string, any> = {
            ...current,
            sections: payload.sections,
            hero_title: payload.heroTitle || null,
            hero_subtitle: payload.heroSubtitle || null,
            description: payload.description || null,
            hero_image: payload.heroImage || null,
            about_title: payload.aboutTitle || null,
            about_subtitle: payload.aboutSubtitle || null,
            about_text1: payload.aboutText1 || null,
            about_text2: payload.aboutText2 || null,
            about_image: payload.aboutImage || null,
            stat1_value: payload.stat1Value || null,
            stat1_label: payload.stat1Label || null,
            stat2_value: payload.stat2Value || null,
            stat2_label: payload.stat2Label || null,
            stat3_value: payload.stat3Value || null,
            stat3_label: payload.stat3Label || null,
            services_title: payload.servicesTitle || null,
            services_subtitle: payload.servicesSubtitle || null,
            services: payload.services,
            gallery_title: payload.galleryTitle || null,
            gallery_subtitle: payload.gallerySubtitle || null,
            gallery_images: payload.galleryImages,
            testimonials_title: payload.testimonialsTitle || null,
            testimonials_subtitle: payload.testimonialsSubtitle || null,
            testimonials: payload.testimonials,
            contact_title: payload.contactTitle || null,
            contact_subtitle: payload.contactSubtitle || null,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabaseAdmin
            .from("organizations")
            .update({ settings: newSettings })
            .eq("id", payload.orgId);

        if (error) return { error: "Erreur: " + error.message };

        revalidatePath("/dashboard/settings");
        if (org?.slug) revalidatePath(`/${org.slug}`);

        return { success: true };
    } catch (e: any) {
        return { error: e.message || "Erreur inattendue" };
    }
}
