import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { InboxSidebar } from "@/components/dashboard/inbox/InboxSidebar";
import { ChatWindow } from "@/components/dashboard/inbox/ChatWindow";
import { PlanGate } from "@/components/dashboard/PlanGate";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";
import Image from "next/image";
import { MessageSquare } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { deriveWhatsAppAccess } from "@/lib/whatsapp/access";
import { WhatsAppTrialBanner } from "@/components/dashboard/inbox/WhatsAppTrialBanner";

export const dynamic = "force-dynamic";

export default async function InboxPage(props: { searchParams: Promise<{ conversationId?: string }> }) {
    const t = await getTranslations("dashboard.inbox");
    const searchParams = await props.searchParams;
    const { userId, profile } = await getCurrentProfile();
    if (!userId) redirect("/sign-in");

    const supabase = await createClient();
    if (!profile?.organization_id) {
        redirect("/dashboard/onboarding");
    }

    const orgId = profile.organization_id;

    // ── Accès messagerie: plan payant, essai WhatsApp en cours, ou blocage ──
    const { data: org } = await supabase
        .from("organizations")
        .select("subscription_plan, settings")
        .eq("id", orgId)
        .single();

    const access = deriveWhatsAppAccess(org);

    if (!access.allowed) {
        return <PlanGate feature="unified_inbox" variant="trial_expired" />;
    }

    // Use admin client to bypass RLS (consistent with all dashboard pages)
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { data: conversations, error: conversationsError } = await supabaseAdmin
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
        .eq("organization_id", orgId)
        .order("last_message_at", { ascending: false })
        .limit(20);

    // Discarding this error is how a missing `customers.avatar_url` column made
    // the inbox read as empty for five months instead of failing loudly.
    if (conversationsError) {
        console.error(
            `[inbox] conversations query failed for org ${orgId}:`,
            conversationsError.message
        );
    }

    // Get the latest message for each conversation's preview
    const formattedConversations = conversations?.map((c: any) => {
        const sortedMessages = (c.messages || []).sort(
            (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        return {
            ...c,
            messages: sortedMessages.slice(0, 1),
        };
    }) || [];

    const selectedConversationId = searchParams.conversationId;
    const selectedConversation = formattedConversations.find((c: any) => c.id === selectedConversationId);

    const unreadTotal = (formattedConversations ?? []).reduce(
        (sum: number, c: { unread_count?: number }) => sum + (c.unread_count || 0),
        0
    );

    return (
        <div className="flex flex-col h-[100dvh] md:h-screen overflow-hidden bg-background">
            {/* Same header shell as every other dashboard page — the inbox was the
                only one that opened straight into its content. */}
            <header className="hidden md:flex items-center justify-between px-6 py-4 border-b border-border bg-card shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <div>
                        <h1 className="text-xl font-bold font-serif text-foreground">{t('title')}</h1>
                        <p className="text-sm text-muted-foreground">
                            {unreadTotal > 0
                                ? t('unreadSummary', { count: unreadTotal })
                                : t('allRead')}
                        </p>
                    </div>
                </div>
            </header>

            {access.state === "trial" && <WhatsAppTrialBanner daysLeft={access.daysLeft} />}

            <div className="flex flex-1 min-h-0 overflow-hidden relative bg-background">

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
                        key={selectedConversationId}
                        conversationId={selectedConversationId}
                        customerName={selectedConversation?.customers?.full_name || "Client"}
                        customerAvatar={selectedConversation?.customers?.avatar_url}
                        channelPlatform={selectedConversation?.channels?.platform}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center animate-in fade-in duration-500">
                        <div className="h-32 w-32 bg-muted/20 rounded-full flex items-center justify-center mb-6 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                            <Image src="/globe.svg" alt="Inbox" width={64} height={64} className="opacity-20 grayscale" />
                        </div>
                        <h3 className="text-xl font-serif font-bold text-foreground mb-2">{t('unifiedInbox')}</h3>
                        <p className="max-w-xs mx-auto text-sm leading-relaxed">
                            {t('selectConversation')}
                        </p>
                    </div>
                )}
            </div>

            </div>
        </div>
    );
}
