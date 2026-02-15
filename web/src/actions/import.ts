"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function importMenuAction(items: any[]) {
    if (!items || items.length === 0) return { error: "Aucun élément à importer" };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Non authentifié" };

    // Get Organization ID
    const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
    if (!profile?.organization_id) return { error: "Organisation introuvable" };

    try {
        // Map Excel columns to Database columns
        const productsToInsert = items.map(item => ({
            organization_id: profile.organization_id,
            name: item['Nom du Plat'] || item['Name'] || item['name'],
            description: item['Description'] || item['description'] || "",
            price_cents: Math.round(parseFloat(item['Prix'] || item['Price'] || item['price'] || "0") * 100),
            category: item['Catégorie'] || item['Category'] || item['category'] || "Plat",
            image_url: item['Image URL'] || item['ImageUrl'] || item['image_url'] || null,
            is_active: true
        })).filter(p => p.name && p.price_cents > 0); // basic validation

        if (productsToInsert.length === 0) {
            return { error: "Aucun produit valide trouvé. Vérifiez les colonnes." };
        }

        const { error } = await supabase.from("products").insert(productsToInsert);

        if (error) {
            console.error("Import Error:", error);
            return { error: "Erreur lors de l'import: " + error.message };
        }

        revalidatePath("/dashboard/menu");
        return { success: true, count: productsToInsert.length };

    } catch (e: any) {
        return { error: "Erreur de traitement: " + e.message };
    }
}
