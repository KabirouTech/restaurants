"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Normalize a category string from Excel — accept anything as-is, just clean it up
function normalizeCategory(raw: any): string {
    if (!raw) return "Plat";
    const str = String(raw).trim();
    return str.length > 0 ? str : "Plat";
}

export async function importMenuAction(items: any[]) {
    if (!items || items.length === 0) return { error: "Aucun élément à importer" };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Non authentifié" };

    const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
    if (!profile?.organization_id) return { error: "Organisation introuvable" };

    try {
        // Map Excel columns to DB columns — accept any category value
        const productsToInsert = items.map(item => {
            const rawPrice = item['Prix'] ?? item['Price'] ?? item['price'] ?? item['Prix (€)'] ?? 0;
            const price = parseFloat(String(rawPrice).replace(',', '.')) || 0;
            const category = normalizeCategory(
                item['Catégorie'] ?? item['Categorie'] ?? item['Category'] ?? item['category'] ?? item['Cat'] ?? null
            );

            return {
                organization_id: profile.organization_id,
                name: (item['Nom du Plat'] || item['Nom'] || item['Name'] || item['name'] || "").toString().trim(),
                description: (item['Description'] || item['description'] || "").toString().trim(),
                price_cents: Math.round(price * 100),
                category,
                image_url: (item['Image URL'] || item['ImageUrl'] || item['image_url'] || null),
                is_active: true,
            };
        }).filter(p => p.name && p.price_cents > 0); // basic validation: must have a name and a price

        if (productsToInsert.length === 0) {
            return { error: "Aucun produit valide trouvé. Vérifiez que les colonnes 'Nom du Plat' et 'Prix' sont renseignées." };
        }

        // Insert one by one to get partial success and clear error messages
        let inserted = 0;
        const errors: string[] = [];
        const newCategories = new Set<string>();

        for (const product of productsToInsert) {
            const { error } = await supabase.from("products").insert(product);
            if (error) {
                console.error("Import product error:", product.name, error.message);
                errors.push(`"${product.name}": ${error.message}`);
            } else {
                inserted++;
                newCategories.add(product.category);
            }
        }

        revalidatePath("/dashboard/menu");

        if (inserted === 0) {
            return { error: `Import échoué.\n${errors.slice(0, 3).join("\n")}` };
        }

        const skipped = productsToInsert.length - inserted;
        const categoriesCreated = Array.from(newCategories).join(", ");
        return {
            success: true,
            count: inserted,
            skipped,
            message: `${inserted} plat(s) importé(s) avec succès${skipped > 0 ? ` (${skipped} ignoré(s))` : ""}.${categoriesCreated ? `\nCatégories créées : ${categoriesCreated}` : ""}`,
        };

    } catch (e: any) {
        return { error: "Erreur de traitement: " + e.message };
    }
}
