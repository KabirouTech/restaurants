"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { getRequiredOrganizationContext } from "@/lib/auth/organization-context";

export async function updateMenuInfoAction(input: {
    orgId: string
    clientMessage: string
    legalMentions: string
    allergenDisclaimer: string
    labels: string[]
    allergensPresent: string[]
}) {
    const t = await getTranslations("errors");
    const orgContext = await getRequiredOrganizationContext(t("orgNotFound"), t("notAuthenticated"));
    if (!orgContext.ok) return { error: orgContext.error };
    const { organizationId } = orgContext.context;

    if (input.orgId !== organizationId) {
        return { error: t("orgUnauthorized") };
    }

    const supabase = await createClient();

    try {
        const { data: existingOrg } = await supabase
            .from("organizations")
            .select("settings, slug")
            .eq("id", input.orgId)
            .single();

        const currentSettings = (existingOrg?.settings || {}) as Record<string, any>;

        const newSettings: Record<string, any> = {
            ...currentSettings,
            menu_client_message:      input.clientMessage || null,
            menu_legal_mentions:      input.legalMentions || null,
            menu_allergen_disclaimer: input.allergenDisclaimer || null,
            menu_labels:              input.labels,
            menu_allergens_present:   input.allergensPresent,
            updated_at: new Date().toISOString(),
        };

        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        const { error } = await supabaseAdmin
            .from("organizations")
            .update({ settings: newSettings })
            .eq("id", input.orgId);

        if (error) return { error: error.message };

        revalidatePath("/dashboard/settings");
        if (existingOrg?.slug) revalidatePath(`/${existingOrg.slug}`);

        return { success: true };
    } catch (e: any) {
        return { error: e.message || t("unexpectedError") };
    }
}

export async function updateSettingsAction(formData: FormData) {
    const t = await getTranslations("errors");
    const orgContext = await getRequiredOrganizationContext(t("orgNotFound"), t("notAuthenticated"));
    if (!orgContext.ok) return { error: orgContext.error };
    const { organizationId } = orgContext.context;

    const supabase = await createClient();

    try {
        const orgId = formData.get("orgId") as string;
        if (orgId !== organizationId) {
            return { error: t("orgUnauthorized") };
        }
        const name = formData.get("name") as string;
        const rawSlug = formData.get("slug") as string;
        const description = formData.get("description") as string;
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

        // Slug validation
        const slug = rawSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
        if (!slug || slug.length < 3) {
            return { error: t("slugTooShort") };
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
                return { error: t("slugTaken") };
            }
        }

        const currentSettings = (existingOrg?.settings || {}) as Record<string, any>;

        const newSettings: Record<string, any> = {
            ...currentSettings,
            description: description || null,
            logo_url: logoUrl || null,
            currency: currency || "EUR",
            contact_phone: contactPhone || null,
            contact_email: contactEmail || null,
            contact_address: contactAddress || null,
            social_instagram: instagram || null,
            social_facebook: facebook || null,
            social_twitter: twitter || null,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabaseAdmin
            .from("organizations")
            .update({ name, slug, settings: newSettings })
            .eq("id", orgId);

        if (error) return { error: error.message };

        revalidatePath("/dashboard/settings");
        revalidatePath(`/${existingOrg?.slug || slug}`);
        if (slug !== existingOrg?.slug) revalidatePath(`/${slug}`);

        return { success: true };

    } catch (e: any) {
        console.error("updateSettingsAction:", e);
        return { error: e.message || t("unexpectedError") };
    }
}
