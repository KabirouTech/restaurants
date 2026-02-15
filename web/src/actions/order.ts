"use server";

import { createClient } from "@supabase/supabase-js";

export async function submitOrder(orgId: string, customerData: any, items: any[], totalCents: number) {
    // SECURITY: Use Service Role Key to bypass RLS for public submissions
    // Ensure this action is only doing what it's supposed to do (creating orders)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Create or Find Customer
    // Simplified: We assume a new customer for now or we match by email if we wanted to be smarter.
    // For now, let's just insert into 'customers' if we have that table, or just store customer info in orders JSON if schema allows.
    // Checking schema: 'customers' table exists.

    // Check if customer exists by email
    const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerData.email)
        .eq('organization_id', orgId)
        .single();

    let customerId = existingCustomer?.id;

    if (!customerId) {
        const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert({
                organization_id: orgId,
                full_name: customerData.name,
                email: customerData.email,
                phone: customerData.phone,
                // created_at, updated_at handled by DB defaults usually
            })
            .select()
            .single();

        if (customerError) {
            console.error("Error creating customer:", customerError);
            return { error: "Failed to create customer" };
        }
        customerId = newCustomer.id;
    }

    // 2. Create Order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            organization_id: orgId,
            customer_id: customerId,
            total_amount_cents: totalCents,
            status: 'pending', // Default status
            event_date: customerData.date || null,
            internal_notes: customerData.notes
        })
        .select()
        .single();

    if (orderError) {
        console.error("Error creating order:", orderError);
        return { error: "Failed to create order" };
    }

    // 3. Create Order Items
    const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price_cents: item.priceCents,
        // total_price_cents: item.priceCents * item.quantity // Not in schema, can be calculated
    }));

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

    if (itemsError) {
        console.error("Error creating order items:", itemsError);
        // Should probably rollback here in a real app
        return { error: "Failed to add items to order" };
    }

    return { success: true, orderId: order.id };
}
