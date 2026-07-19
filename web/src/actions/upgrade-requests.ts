"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getRequiredOrganizationContext } from "@/lib/auth/organization-context";

/**
 * Soumet une demande d'upgrade de plan. Un admin RestaurantsOS la traitera.
 *
 * Remplace l'ancien chemin client (`lib/plans/upgrade-pipeline.ts::
 * createUpgradeRequest`) : depuis la migration Clerk, le client navigateur n'a
 * plus de session Supabase (RLS aveugle) et passait l'ID Clerk `user_…` dans
 * `requested_by UUID` — l'insert échouait systématiquement. Ici tout passe par
 * le client admin avec le contexte org vérifié, et `requested_by` est le vrai
 * UUID du profil.
 */
export async function requestUpgradeAction(input: {
    targetPlan: "premium" | "enterprise";
    notes?: string;
}) {
    const orgContext = await getRequiredOrganizationContext("Aucune organisation");
    if (!orgContext.ok) return { error: orgContext.error };
    const { organizationId, profileId } = orgContext.context;

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { data: org } = await supabaseAdmin
        .from("organizations")
        .select("subscription_plan")
        .eq("id", organizationId)
        .single();

    if (org?.subscription_plan === input.targetPlan) {
        return { error: "Vous êtes déjà sur ce plan." };
    }

    const { data: existing } = await supabaseAdmin
        .from("upgrade_requests")
        .select("id")
        .eq("organization_id", organizationId)
        .in("status", ["pending", "processing"])
        .maybeSingle();

    if (existing) {
        return {
            error: "Une demande d'upgrade est déjà en cours. Notre équipe la traitera sous 24h.",
        };
    }

    const { data, error } = await supabaseAdmin
        .from("upgrade_requests")
        .insert({
            organization_id: organizationId,
            requested_by: profileId,
            target_plan: input.targetPlan,
            payment_method: "other",
            notes: input.notes ?? null,
            status: "pending",
        })
        .select("id")
        .single();

    if (error) {
        console.error("[requestUpgradeAction] insert failed:", error);
        return { error: "Erreur lors de la création de la demande." };
    }

    revalidatePath("/dashboard");
    return { success: true, requestId: data.id };
}
