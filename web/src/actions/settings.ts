"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateSettingsAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Non authentifié");

    const orgId = formData.get("orgId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const heroImage = formData.get("heroImage") as string;
    const heroTitle = formData.get("heroTitle") as string;
    const heroSubtitle = formData.get("heroSubtitle") as string;
    const contactPhone = formData.get("phone") as string;
    const contactEmail = formData.get("email") as string;
    const contactAddress = formData.get("address") as string;

    // Fetch existing settings to merge (don't overwrite other fields if they exist)
    const { data: existingOrg } = await supabase
        .from("organizations")
        .select("settings, slug")
        .eq("id", orgId)
        .single();

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
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from("organizations")
        .update({
            name,
            settings: newSettings,
        })
        .eq("id", orgId);

    if (error) {
        console.error("Error updating settings:", error);
        throw new Error("Erreur: " + error.message);
    }

    revalidatePath("/dashboard/settings");
    if (existingOrg?.slug) {
        revalidatePath(`/${existingOrg.slug}`);
    }
}
