"use server";

import { createClient as createServerClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createIngredientAction(formData: FormData) {
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
    if (!profile?.organization_id) return { error: "Organisation introuvable" };

    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const unit = formData.get("unit") as string;
    const current_stock = parseFloat(formData.get("current_stock") as string) || 0;
    const low_stock_threshold = parseFloat(formData.get("low_stock_threshold") as string) || 0;
    const cost_per_unit = parseFloat(formData.get("cost_per_unit") as string) || 0;
    const supplier_id = formData.get("supplier_id") as string;

    try {
        const { error } = await supabase
            .from("ingredients")
            .insert({
                organization_id: profile.organization_id,
                name,
                category: category || null,
                unit: unit || "kg",
                current_stock,
                low_stock_threshold,
                cost_per_unit_cents: Math.round(cost_per_unit * 100),
                supplier_id: supplier_id || null,
            });

        if (error) {
            console.error("Create Ingredient Error:", error);
            return { error: "Erreur lors de la création de l'ingrédient." };
        }

        revalidatePath("/dashboard/inventory");
        return { success: true };
    } catch {
        return { error: "Une erreur inattendue est survenue." };
    }
}

export async function updateIngredientAction(formData: FormData) {
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const unit = formData.get("unit") as string;
    const current_stock = parseFloat(formData.get("current_stock") as string) || 0;
    const low_stock_threshold = parseFloat(formData.get("low_stock_threshold") as string) || 0;
    const cost_per_unit = parseFloat(formData.get("cost_per_unit") as string) || 0;
    const supplier_id = formData.get("supplier_id") as string;

    try {
        const { error } = await supabase
            .from("ingredients")
            .update({
                name,
                category: category || null,
                unit: unit || "kg",
                current_stock,
                low_stock_threshold,
                cost_per_unit_cents: Math.round(cost_per_unit * 100),
                supplier_id: supplier_id || null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
            console.error("Update Ingredient Error:", error);
            return { error: "Erreur lors de la mise à jour." };
        }

        revalidatePath("/dashboard/inventory");
        return { success: true };
    } catch {
        return { error: "Erreur inattendue." };
    }
}

export async function deleteIngredientAction(id: string) {
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    try {
        const { error } = await supabase
            .from("ingredients")
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq("id", id);

        if (error) {
            console.error("Delete Ingredient Error:", error);
            return { error: "Erreur lors de la suppression." };
        }

        revalidatePath("/dashboard/inventory");
        return { success: true };
    } catch {
        return { error: "Erreur inattendue." };
    }
}

export async function bulkDeleteIngredientsAction(ids: string[]) {
    if (!ids.length) return { error: "Aucun ingrédient sélectionné." };

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
    if (!profile?.organization_id) return { error: "Organisation introuvable" };

    const { error } = await supabase
        .from("ingredients")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in("id", ids)
        .eq("organization_id", profile.organization_id);

    if (error) return { error: "Erreur lors de la suppression : " + error.message };

    revalidatePath("/dashboard/inventory");
    return { success: true, count: ids.length };
}

export async function importIngredientsAction(rows: {
    name: string;
    category?: string;
    unit?: string;
    current_stock?: number;
    low_stock_threshold?: number;
    cost_per_unit?: number;
    supplier_id?: string;
}[]) {
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
    if (!profile?.organization_id) return { error: "Organisation introuvable" };

    if (!rows.length) return { error: "Aucune ligne à importer." };

    const valid = rows.filter(r => r.name?.trim());
    if (!valid.length) return { error: "Aucun ingrédient valide trouvé (colonne 'Nom' manquante)." };

    const payload = valid.map(r => ({
        organization_id: profile.organization_id,
        name: r.name.trim(),
        category: r.category?.trim() || null,
        unit: r.unit?.trim() || "kg",
        current_stock: r.current_stock || 0,
        low_stock_threshold: r.low_stock_threshold || 0,
        cost_per_unit_cents: Math.round((r.cost_per_unit || 0) * 100),
        supplier_id: r.supplier_id || null,
    }));

    let inserted = 0;
    const errors: string[] = [];

    for (const ingredient of payload) {
        const { error } = await supabase.from("ingredients").insert(ingredient);
        if (!error) {
            inserted++;
        } else if (error.code !== "23505") {
            errors.push(error.message);
        }
    }

    revalidatePath("/dashboard/inventory");

    if (inserted === 0 && errors.length > 0) {
        return { error: `Echec de l'import : ${errors[0]}` };
    }

    return { success: true, count: inserted };
}
