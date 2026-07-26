"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { sendExternalMessage } from "@/lib/channels/index";
import { getRequiredOrganizationContext } from "@/lib/auth/organization-context";
import { getWhatsAppAccess } from "@/lib/whatsapp/access";

export async function fetchMessagesAction(conversationId: string) {
    const orgContext = await getRequiredOrganizationContext("Aucune organisation");
    if (!orgContext.ok) return { error: orgContext.error };
    const { organizationId } = orgContext.context;

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    // Verify the conversation belongs to the user's org
    const { data: conv } = await supabaseAdmin
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("organization_id", organizationId)
        .single();

    if (!conv) return { error: "Conversation introuvable" };

    const { data: messages } = await supabaseAdmin
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

    // Reset unread count when conversation is opened
    await supabaseAdmin
        .from("conversations")
        .update({ unread_count: 0 })
        .eq("id", conversationId)
        .eq("organization_id", organizationId);

    return { messages: messages || [] };
}

export interface OutgoingAttachment {
    /** Publicly reachable URL — Meta fetches the media by URL when relaying it. */
    url: string;
    type: "image" | "document" | "audio" | "video";
    filename?: string;
    mime_type?: string;
}

const ATTACHMENT_BUCKET = "message-attachments";
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/** Maps a MIME type onto the media categories the channel APIs accept. */
function attachmentKind(mime: string): OutgoingAttachment["type"] {
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("audio/")) return "audio";
    if (mime.startsWith("video/")) return "video";
    return "document";
}

/**
 * Upload one composer attachment and hand back its public URL.
 *
 * Runs on the service role rather than from the browser so the bucket needs no
 * INSERT policy, and so the org check can't be bypassed by a crafted client.
 */
export async function uploadMessageAttachmentAction(formData: FormData) {
    const orgContext = await getRequiredOrganizationContext("Aucune organisation");
    if (!orgContext.ok) return { error: orgContext.error };
    const { organizationId } = orgContext.context;

    const file = formData.get("file");
    const conversationId = formData.get("conversationId");

    if (!(file instanceof File)) return { error: "Aucun fichier reçu" };
    if (typeof conversationId !== "string") return { error: "Conversation manquante" };
    if (file.size > MAX_ATTACHMENT_BYTES) {
        return { error: `Fichier trop volumineux (max ${MAX_ATTACHMENT_BYTES / 1024 / 1024} Mo)` };
    }

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { data: conv } = await supabaseAdmin
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("organization_id", organizationId)
        .single();

    if (!conv) return { error: "Conversation introuvable" };

    const safeName = file.name.replace(/[^\w.\-]/g, "_").slice(-80);
    const path = `${organizationId}/${conversationId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabaseAdmin.storage
        .from(ATTACHMENT_BUCKET)
        .upload(path, file, { contentType: file.type || undefined, upsert: false });

    if (uploadError) return { error: uploadError.message };

    const { data: pub } = supabaseAdmin.storage.from(ATTACHMENT_BUCKET).getPublicUrl(path);

    const attachment: OutgoingAttachment = {
        url: pub.publicUrl,
        type: attachmentKind(file.type || ""),
        filename: file.name,
        mime_type: file.type || undefined,
    };

    return { attachment };
}

export async function sendMessageAction(
    conversationId: string,
    content: string,
    attachments: OutgoingAttachment[] = []
) {
    const orgContext = await getRequiredOrganizationContext("Aucune organisation");
    if (!orgContext.ok) return { error: orgContext.error };
    const { organizationId } = orgContext.context;

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    // Block sending once the WhatsApp free trial has expired (free orgs only).
    const access = await getWhatsAppAccess(supabaseAdmin, organizationId);
    if (!access.allowed) {
        return { error: "Votre essai WhatsApp gratuit est terminé. Passez au Premium pour envoyer des messages." };
    }

    // Fetch conversation with channel info for routing
    const { data: conv } = await supabaseAdmin
        .from("conversations")
        .select("id, external_thread_id, channels(platform, credentials)")
        .eq("id", conversationId)
        .eq("organization_id", organizationId)
        .single();

    if (!conv) return { error: "Conversation introuvable" };

    const { data: message, error } = await supabaseAdmin
        .from("messages")
        .insert({
            conversation_id: conversationId,
            sender_type: "agent",
            content,
            ...(attachments.length > 0 ? { attachments } : {}),
        })
        .select()
        .single();

    if (error) return { error: error.message };

    // Update conversation's last_message_at
    await supabaseAdmin
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId)
        .eq("organization_id", organizationId);

    // Route to external channel if applicable
    const channel = (conv as any).channels;
    let deliveryError: string | null = null;

    if (channel && channel.platform !== "website" && conv.external_thread_id) {
        try {
            const result = await sendExternalMessage(
                channel.platform,
                channel.credentials,
                conv.external_thread_id,
                content,
                undefined,
                attachments
            );

            // Store external_message_id and api_response on the message
            if (result.externalMessageId || result.error) {
                await supabaseAdmin
                    .from("messages")
                    .update({
                        external_message_id: result.externalMessageId || null,
                        api_response: result as any,
                    })
                    .eq("id", message.id);
            }

            if (result.error) deliveryError = result.error;
        } catch (err: any) {
            console.error("Failed to send external message:", err);
            deliveryError = err?.message || "Échec de l'envoi vers le canal externe";
        }
    }

    revalidatePath("/dashboard/inbox");

    // The message row exists either way, but reporting success on a rejected
    // delivery is how an over-long Instagram message got a checkmark and was
    // never sent. Hand the failure back so the composer can say so.
    return deliveryError ? { message, deliveryError } : { message };
}
