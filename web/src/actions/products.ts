"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getRequiredOrganizationContext } from "@/lib/auth/organization-context";

// --- Create Product ---
export async function createProductAction(formData: FormData) {
    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };

    const supabase = await createClient();
    const { organizationId } = orgContext.context;

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const priceStr = formData.get("price") as string;
    const category = formData.get("category") as string || "Plat";
    const imageUrl = formData.get("imageUrl") as string;

    const priceCents = Math.round(parseFloat(priceStr) * 100);

    const { error } = await supabase.from("products").insert({
        organization_id: organizationId,
        name,
        description,
        price_cents: priceCents,
        category,
        image_url: imageUrl,
        is_active: true
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath("/dashboard/menu");
    return { success: true };
}

// --- Update Product ---
export async function updateProductAction(formData: FormData) {
    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };

    const supabase = await createClient();
    const { organizationId } = orgContext.context;

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const priceStr = formData.get("price") as string;
    const category = formData.get("category") as string;

    // Optional
    const imageUrl = formData.get("imageUrl") as string;

    const priceCents = Math.round(parseFloat(priceStr) * 100);

    const updateData: any = {
        name,
        description,
        price_cents: priceCents,
        category,
    };
    if (imageUrl) updateData.image_url = imageUrl;

    const { error } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", id)
        .eq("organization_id", organizationId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/menu");
    return { success: true };
}

// --- Delete Product ---
export async function deleteProductAction(productId: string) {
    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };

    const supabase = await createClient();
    const { organizationId } = orgContext.context;

    const { error } = await supabase
        .from("products")
        .update({ is_active: false }) // Soft Delete
        .eq("id", productId)
        .eq("organization_id", organizationId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/menu");
    return { success: true };
}
// --- Bulk Delete Products ---
export async function bulkDeleteProductsAction(ids: string[]) {
    if (!ids.length) return { error: "Aucun produit sélectionné." };

    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };

    const supabase = await createClient();
    const { organizationId } = orgContext.context;

    const { error } = await supabase
        .from("products")
        .update({ is_active: false }) // Soft delete
        .in("id", ids)
        .eq("organization_id", organizationId); // safety scope

    if (error) return { error: "Erreur lors de la suppression : " + error.message };

    revalidatePath("/dashboard/menu");
    return { success: true, count: ids.length };
}
