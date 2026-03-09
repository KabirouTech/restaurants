"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// --- Create Capacity Type ---
export async function createCapacityTypeAction(formData: FormData) {
    const { userId } = await auth();
    if (!userId) return { error: "Non authentifié" };

    const supabase = await createClient();
    // Get Organization ID
    const { data: profile } = await supabase.from("profiles").select("organization_id").eq("clerk_id", userId).single();
    if (!profile?.organization_id) return { error: "Organisation introuvable" };

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
            organization_id: profile.organization_id,
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
    const { userId } = await auth();
    if (!userId) return { error: "Non authentifié" };

    const supabase = await createClient();

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
        .eq("id", id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
}

// --- Delete Capacity Type ---
export async function deleteCapacityTypeAction(id: string) {
    const { userId } = await auth();
    if (!userId) return { error: "Non authentifié" };

    const supabase = await createClient();

    const { error } = await supabase
        .from("capacity_types")
        .delete()
        .eq("id", id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
}
