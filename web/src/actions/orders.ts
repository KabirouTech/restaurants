"use server";

import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/current-profile";

// --- Create Order + Customer + Items ---
export async function createOrderAction(formData: any) {
    // 1. Verify User with Clerk
    const { userId, profile } = await getCurrentProfile();
    if (!userId) return { error: "Non authentifié" };
    const orgId = profile?.organization_id;
    if (!orgId) return { error: "Organisation introuvable" };

    // 2. Use Service Role Client for Mutations (Bypass RLS)
    const supabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        // 1. Handle Customer (Create or Use Existing)
        let customerId = formData.customerId;

        if (!customerId && formData.customerName) {
            // Create new customer
            const { data: newCustomer, error: custError } = await supabase
                .from("customers")
                .insert({
                    organization_id: orgId,
                    full_name: formData.customerName,
                    email: formData.customerEmail,
                    phone: formData.customerPhone,
                })
                .select()
                .single();

            if (custError) throw new Error("Erreur création client: " + custError.message);
            customerId = newCustomer.id;
        }

        if (!customerId) throw new Error("Client requis");

        // 2. Create Order
        const eventTime = formData.eventTime || null;
        const guestCount = parseInt(formData.guestCount) || null;

        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                organization_id: orgId,
                customer_id: customerId,
                event_date: formData.eventDate,
                event_time: eventTime,
                guest_count: guestCount,
                capacity_type_id: formData.capacityTypeId,
                status: "draft",
                total_amount_cents: formData.totalAmountCents,
                internal_notes: formData.internalNotes || null,
            })
            .select()
            .single();


        if (orderError) throw new Error("Erreur création commande: " + orderError.message);

        // 3. Create Order Items
        const items = formData.items.map((item: any) => ({
            order_id: order.id,
            product_id: item.productId,
            quantity: item.quantity,
            unit_price_cents: item.unitPriceCents,
            // unique description or customization if needed
        }));

        if (items.length > 0) {
            const { error: itemsError } = await supabase.from("order_items").insert(items);
            if (itemsError) throw new Error("Erreur ajout articles: " + itemsError.message);
        }

        revalidatePath("/dashboard/orders");
        return { success: true, orderId: order.id };

    } catch (error: any) {
        console.error("Create Order Error:", error);
        return { error: error.message };
    }
}

// --- Search Customers ---
export async function searchCustomersAction(query: string) {
    const { userId, profile } = await getCurrentProfile();
    if (!userId) return [];

    const supabase = await createServerClient();
    const orgId = profile?.organization_id;

    if (!orgId) return [];

    const { data } = await supabase
        .from("customers")
        .select("id, full_name, email, phone")
        .eq("organization_id", orgId)
        .ilike("full_name", `%${query}%`)
        .limit(5);

    return data || [];
}

// --- Bulk Delete Orders ---
export async function bulkDeleteOrdersAction(ids: string[]) {
    if (!ids.length) return { error: "Aucune commande sélectionnée." };

    const { userId, profile } = await getCurrentProfile();
    if (!userId) return { error: "Non authentifié" };
    const supabase = await createServerClient();
    if (!profile?.organization_id) return { error: "Organisation introuvable" };

    // Delete order_items first (FK constraint)
    await supabase.from("order_items").delete().in("order_id", ids);

    // Then delete orders, scoped to org for safety
    const { error } = await supabase
        .from("orders")
        .delete()
        .in("id", ids)
        .eq("organization_id", profile.organization_id);

    if (error) return { error: "Erreur lors de la suppression : " + error.message };

    revalidatePath("/dashboard/orders");
    return { success: true, count: ids.length };
}
