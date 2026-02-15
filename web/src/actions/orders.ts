"use server";

import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// --- Create Order + Customer + Items ---
export async function createOrderAction(formData: any) {
    // 1. Verify User with Cookie Client
    const supabaseUser = await createServerClient();
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) return { error: "Non authentifié" };

    // Get Org
    const { data: profile } = await supabaseUser.from("profiles").select("organization_id").eq("id", user.id).single();
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
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                organization_id: orgId,
                customer_id: customerId,
                event_date: formData.eventDate,
                event_time: formData.eventTime,
                guest_count: parseInt(formData.guestCount),
                capacity_type_id: formData.capacityTypeId,
                status: "draft", // Starts as draft
                total_amount_cents: formData.totalAmountCents,
                internal_notes: formData.internalNotes
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
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
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
