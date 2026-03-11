"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getRequiredOrganizationContext } from "@/lib/auth/organization-context";

// --- Create Capacity Type ---
export async function createCapacityTypeAction(formData: FormData) {
    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };

    const supabase = await createClient();
    const { organizationId } = orgContext.context;

    const name = formData.get("name") as string;
    const loadCostStr = formData.get("loadCost") as string;
    const colorCode = formData.get("colorCode") as string || "#3b82f6"; // Default blue

    const loadCost = parseInt(loadCostStr);

    if (!name || isNaN(loadCost)) {
        return { error: "Nom et coût de charge requis." };
    }

    const { error } = await supabase
        .from("capacity_types")
        .insert({
            organization_id: organizationId,
            name,
            load_cost: loadCost,
            color_code: colorCode,
        });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
}

// --- Update Capacity Type ---
export async function updateCapacityTypeAction(formData: FormData) {
    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };

    const supabase = await createClient();
    const { organizationId } = orgContext.context;

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const loadCostStr = formData.get("loadCost") as string;
    const colorCode = formData.get("colorCode") as string;

    const loadCost = parseInt(loadCostStr);

    if (!id || !name || isNaN(loadCost)) {
        return { error: "ID, Nom et coût de charge requis." };
    }

    const { error } = await supabase
        .from("capacity_types")
        .update({
            name,
            load_cost: loadCost,
            color_code: colorCode,
        })
        .eq("id", id)
        .eq("organization_id", organizationId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
}

// --- Delete Capacity Type ---
export async function deleteCapacityTypeAction(id: string) {
    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };

    const supabase = await createClient();
    const { organizationId } = orgContext.context;

    const { error } = await supabase
        .from("capacity_types")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
}
