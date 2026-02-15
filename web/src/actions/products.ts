"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// --- Create Product ---
export async function createProductAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Non authentifié" };

    // Get Organization ID
    const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
    if (!profile?.organization_id) return { error: "Organisation introuvable" };

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const priceStr = formData.get("price") as string;
    const category = formData.get("category") as string || "Plat";
    const imageUrl = formData.get("imageUrl") as string;

    const priceCents = Math.round(parseFloat(priceStr) * 100);

    const { error } = await supabase.from("products").insert({
        organization_id: profile.organization_id,
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

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
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/menu");
    return { success: true };
}

// --- Delete Product ---
export async function deleteProductAction(productId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const { error } = await supabase
        .from("products")
        .update({ is_active: false }) // Soft Delete
        .eq("id", productId);

    if (error) return { error: error.message };

    revalidatePath("/dashboard/menu");
    return { success: true };
}
