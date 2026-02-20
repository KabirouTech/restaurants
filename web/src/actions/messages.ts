"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function fetchMessagesAction(conversationId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
    if (!profile?.organization_id) return { error: "Aucune organisation" };

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
        .eq("organization_id", profile.organization_id)
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
        .eq("id", conversationId);

    return { messages: messages || [] };
}

export async function sendMessageAction(conversationId: string, content: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
    if (!profile?.organization_id) return { error: "Aucune organisation" };

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
        .eq("organization_id", profile.organization_id)
        .single();

    if (!conv) return { error: "Conversation introuvable" };

    const { data: message, error } = await supabaseAdmin
        .from("messages")
        .insert({
            conversation_id: conversationId,
            sender_type: "agent",
            content,
        })
        .select()
        .single();

    if (error) return { error: error.message };

    // Update conversation's last_message_at
    await supabaseAdmin
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

    revalidatePath("/dashboard/inbox");
    return { message };
}
