"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { sendPushNotification } from "@/lib/firebase-admin";

interface ContactFormPayload {
    orgId: string;
    name: string;
    email: string;
    phone?: string;
    eventType?: string;
    eventDate?: string;
    guestCount?: string;
    message: string;
}

export async function submitContactFormAction(payload: ContactFormPayload) {
    try {
        const supabase = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        // 1. Upsert customer by email
        let customerId: string;
        const { data: existingCustomer } = await supabase
            .from("customers")
            .select("id")
            .eq("email", payload.email)
            .eq("organization_id", payload.orgId)
            .maybeSingle();

        if (existingCustomer?.id) {
            customerId = existingCustomer.id;
        } else {
            const { data: newCustomer, error: customerError } = await supabase
                .from("customers")
                .insert({
                    organization_id: payload.orgId,
                    full_name: payload.name,
                    email: payload.email,
                    phone: payload.phone || null,
                })
                .select("id")
                .single();

            if (customerError || !newCustomer) {
                return { error: "Impossible de créer le contact: " + customerError?.message };
            }
            customerId = newCustomer.id;
        }

        // 2. Get or create the "website" channel for this org
        let channelId: string;
        const { data: existingChannel } = await supabase
            .from("channels")
            .select("id")
            .eq("organization_id", payload.orgId)
            .eq("platform", "website")
            .maybeSingle();

        if (existingChannel?.id) {
            channelId = existingChannel.id;
        } else {
            const { data: newChannel, error: chanErr } = await supabase
                .from("channels")
                .insert({
                    organization_id: payload.orgId,
                    platform: "website",
                    name: "Site Web",
                })
                .select("id")
                .single();

            if (chanErr || !newChannel) {
                // If channels table requires more fields, gracefully continue with null
                channelId = "";
            } else {
                channelId = newChannel.id;
            }
        }

        // 3. Create a new conversation
        const conversationInsert: Record<string, any> = {
            organization_id: payload.orgId,
            customer_id: customerId,
            status: "open",
            unread_count: 1,
            last_message_at: new Date().toISOString(),
        };
        if (channelId) conversationInsert.channel_id = channelId;

        const { data: conversation, error: convError } = await supabase
            .from("conversations")
            .insert(conversationInsert)
            .select("id")
            .single();

        if (convError || !conversation) {
            return { error: "Impossible d'ouvrir la conversation: " + convError?.message };
        }

        // 4. Build rich message content from form fields
        const lines: string[] = [
            `📋 Nouvelle demande via le site web de ${payload.name}`,
            `📧 ${payload.email}`,
        ];
        if (payload.phone) lines.push(`📞 ${payload.phone}`);
        if (payload.eventType) lines.push(`🎉 Type d'événement: ${payload.eventType}`);
        if (payload.eventDate) lines.push(`📅 Date souhaitée: ${payload.eventDate}`);
        if (payload.guestCount) lines.push(`👥 Personnes: ${payload.guestCount}`);
        lines.push(`\n💬 Message:\n${payload.message}`);
        const content = lines.join("\n");

        // 5. Insert message with sender_type = "customer"
        const { error: msgError } = await supabase
            .from("messages")
            .insert({
                conversation_id: conversation.id,
                sender_type: "customer",
                content,
            });

        if (msgError) {
            return { error: "Message non enregistré: " + msgError.message };
        }

        // 6. Send push notifications to org members with FCM tokens
        try {
            const { data: profiles } = await supabase
                .from("profiles")
                .select("fcm_token")
                .eq("organization_id", payload.orgId)
                .not("fcm_token", "is", null);

            if (profiles && profiles.length > 0) {
                const preview = payload.message.slice(0, 100);
                await Promise.allSettled(
                    profiles.map((p) =>
                        sendPushNotification(
                            p.fcm_token!,
                            `Nouveau message de ${payload.name}`,
                            preview,
                            { url: "/dashboard/inbox" }
                        )
                    )
                );
            }
        } catch {
            // Push failure should not break the contact form
        }

        revalidatePath("/dashboard/inbox");
        return { success: true, conversationId: conversation.id };
    } catch (e: any) {
        return { error: e.message || "Erreur inattendue" };
    }
}
