import { createClient } from "@/utils/supabase/server";
import { InboxSidebar } from "@/components/dashboard/inbox/InboxSidebar";
import { ChatWindow } from "@/components/dashboard/inbox/ChatWindow";
import { cn } from "@/lib/utils";
import { Search, Loader2 } from "lucide-react";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function InboxPage(props: { searchParams: Promise<{ conversationId?: string }> }) {
    const searchParams = await props.searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch Conversations + Last Message
    // Tip: Supabase join is powerful.
    const { data: conversations } = await supabase
        .from("conversations")
        .select(`
            id,
            last_message_at,
            unread_count,
            status,
            customers (
                full_name,
                avatar_url
            ),
            channels (
                platform
            ),
            messages (
                content,
                created_at
            )
        `)
        .order("last_message_at", { ascending: false })
        .limit(20);

    // Filter/Sort messages manually if needed, or rely on .order above for conversations.
    // Ideally we want the *latest* message for the snippet.
    // The query above returns ALL messages if not limited by foreign table view, which is bad for perf.
    // A better approach in production is to store 'last_message_preview' on the conversation table.
    // For now, we'll just slice it in JS or assume the array is small per fetch.

    // Let's refine the conversation object for the client component
    const formattedConversations = conversations?.map((c: any) => ({
        ...c,
        messages: c.messages?.slice(0, 1) || [] // Just take one for preview
    })) || [];


    const selectedConversationId = searchParams.conversationId;
    const selectedConversation = formattedConversations.find(c => c.id === selectedConversationId);

    return (
        <div className="flex h-[calc(100vh-theme(spacing.2))] max-h-[800px] border border-border rounded-xl bg-background overflow-hidden relative shadow-sm">

            {/* Sidebar List */}
            <InboxSidebar
                conversations={formattedConversations}
                className={cn(
                    "w-full md:w-80 shrink-0",
                    selectedConversationId ? "hidden md:flex" : "flex"
                )}
            />

            {/* Main Chat Area */}
            <div className={cn(
                "flex-1 flex flex-col bg-muted/10 relative",
                !selectedConversationId ? "hidden md:flex" : "flex"
            )}>
                {selectedConversationId ? (
                    <ChatWindow
                        key={selectedConversationId} // Force re-mount on change
                        conversationId={selectedConversationId}
                        customerName={selectedConversation?.customers?.full_name || "Client"}
                        customerAvatar={selectedConversation?.customers?.avatar_url}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center animate-in fade-in duration-500">
                        <div className="h-32 w-32 bg-muted/20 rounded-full flex items-center justify-center mb-6 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                            <Image src="/globe.svg" alt="Inbox" width={64} height={64} className="opacity-20 grayscale" />
                        </div>
                        <h3 className="text-xl font-serif font-bold text-foreground mb-2">Messagerie Unifiée</h3>
                        <p className="max-w-xs mx-auto text-sm leading-relaxed">
                            Sélectionnez une conversation pour répondre aux demandes WhatsApp, Instagram ou Email.
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
}
