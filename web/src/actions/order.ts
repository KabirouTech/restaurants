"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { sendPushNotification } from "@/lib/firebase-admin";
import { formatPrice } from "@/lib/currencies";

export async function submitOrder(orgId: string, customerData: any, items: any[], totalCents: number) {
    // SECURITY: Use Service Role Key to bypass RLS for public submissions
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Create or Find Customer
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
            status: 'pending',
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
    }));

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

    if (itemsError) {
        console.error("Error creating order items:", itemsError);
        return { error: "Failed to add items to order" };
    }

    // 4. Create conversation + message so the order appears in the inbox
    try {
        // Get or create "website" channel
        let channelId: string | null = null;
        const { data: existingChannel } = await supabase
            .from("channels")
            .select("id")
            .eq("organization_id", orgId)
            .eq("platform", "website")
            .maybeSingle();

        if (existingChannel?.id) {
            channelId = existingChannel.id;
        } else {
            const { data: newChannel } = await supabase
                .from("channels")
                .insert({ organization_id: orgId, platform: "website", name: "Site Web" })
                .select("id")
                .single();
            channelId = newChannel?.id || null;
        }

        // Build message content from the order
        const itemLines = items.map(
            (item) => `  • ${item.name} x${item.quantity}`
        ).join("\n");
        const content = [
            `🛒 Nouvelle commande de ${customerData.name}`,
            `📧 ${customerData.email}`,
            customerData.phone ? `📞 ${customerData.phone}` : null,
            customerData.date ? `📅 Date souhaitée: ${customerData.date}` : null,
            `\n📦 Articles:\n${itemLines}`,
            `\n💰 Total: ${formatPrice(totalCents, "EUR")}`,
            customerData.notes ? `\n📝 Notes: ${customerData.notes}` : null,
        ].filter(Boolean).join("\n");

        const conversationInsert: Record<string, any> = {
            organization_id: orgId,
            customer_id: customerId,
            status: "open",
            unread_count: 1,
            last_message_at: new Date().toISOString(),
        };
        if (channelId) conversationInsert.channel_id = channelId;

        const { data: conversation } = await supabase
            .from("conversations")
            .insert(conversationInsert)
            .select("id")
            .single();

        if (conversation) {
            await supabase
                .from("messages")
                .insert({
                    conversation_id: conversation.id,
                    sender_type: "customer",
                    content,
                });
        }

        // 5. Send push notifications to org members
        const { data: profiles } = await supabase
            .from("profiles")
            .select("fcm_token")
            .eq("organization_id", orgId)
            .not("fcm_token", "is", null);

        if (profiles && profiles.length > 0) {
            const preview = `Commande de ${customerData.name} — ${formatPrice(totalCents, "EUR")}`;
            await Promise.allSettled(
                profiles.map((p) =>
                    sendPushNotification(
                        p.fcm_token!,
                        "Nouvelle commande",
                        preview,
                        { url: "/dashboard/inbox" }
                    )
                )
            );
        }
    } catch {
        // Conversation/push creation should not break the order flow
    }

    revalidatePath("/dashboard/inbox");
    revalidatePath("/dashboard/orders");
    return { success: true, orderId: order.id };
}
