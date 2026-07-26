"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { format, isSameDay, isToday, isYesterday } from "date-fns";
import { fr as frLocale } from "date-fns/locale";
import { useLocale } from "next-intl";
import { Send, Paperclip, MoreVertical, Phone, Instagram, Mail, Globe, MessageCircle, ChevronLeft, Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { fetchMessagesAction, sendMessageAction } from "@/actions/messages";

interface ChatWindowProps {
    conversationId: string;
    customerName: string;
    customerAvatar?: string;
    channelPlatform?: string;
}

const platformConfig: Record<string, { icon: typeof Phone; colorClass: string }> = {
    whatsapp: { icon: Phone, colorClass: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
    instagram: { icon: Instagram, colorClass: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" },
    email: { icon: Mail, colorClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    website: { icon: Globe, colorClass: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" },
};

const platformLabelKeys: Record<string, string> = {
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    email: "Email",
};

interface ChatMessage {
    id: string;
    content: string;
    sender_type: string;
    created_at: string;
    /** Optimistic message awaiting the server round-trip. */
    pending?: boolean;
}

/** Consecutive messages from the same side within this window share a bubble stack. */
const GROUP_WINDOW_MS = 5 * 60 * 1000;

type ChatRow =
    | { kind: "date"; key: string; date: Date }
    | { kind: "system"; key: string; message: ChatMessage }
    | { kind: "group"; key: string; outgoing: boolean; messages: ChatMessage[] };

/**
 * Flattens the message list into render rows: a separator whenever the day
 * changes, and one group per run of same-side messages sent close together.
 * Grouping is what stops six rapid "test" messages from reading as six
 * disconnected blocks each with its own timestamp.
 */
function buildRows(messages: ChatMessage[]): ChatRow[] {
    const rows: ChatRow[] = [];
    let previousDate: Date | null = null;

    for (const message of messages) {
        const date = new Date(message.created_at);

        if (!previousDate || !isSameDay(date, previousDate)) {
            rows.push({ kind: "date", key: `date-${message.id}`, date });
            previousDate = date;
        }

        if (message.sender_type === "system") {
            rows.push({ kind: "system", key: message.id, message });
            continue;
        }

        const outgoing = message.sender_type === "agent";
        const last = rows[rows.length - 1];

        if (last?.kind === "group" && last.outgoing === outgoing) {
            const previous = last.messages[last.messages.length - 1];
            const gap = date.getTime() - new Date(previous.created_at).getTime();
            if (gap >= 0 && gap <= GROUP_WINDOW_MS) {
                last.messages.push(message);
                continue;
            }
        }

        rows.push({ kind: "group", key: message.id, outgoing, messages: [message] });
    }

    return rows;
}

export function ChatWindow({ conversationId, customerName, customerAvatar, channelPlatform }: ChatWindowProps) {
    const t = useTranslations("dashboard.inbox");
    const tc = useTranslations("common");
    const locale = useLocale();
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const platform = channelPlatform ? platformConfig[channelPlatform] : null;
    const PlatformIcon = platform?.icon || MessageCircle;

    const dateOpts = locale === "fr" ? { locale: frLocale } : undefined;
    const rows = useMemo(() => buildRows(messages), [messages]);

    const dayLabel = (date: Date) => {
        if (isToday(date)) return t('today');
        if (isYesterday(date)) return t('yesterday');
        return format(date, "d MMMM yyyy", dateOpts);
    };

    useEffect(() => {
        // Fetch existing messages via server action
        const fetchMessages = async () => {
            const result = await fetchMessagesAction(conversationId);
            if (result.messages) setMessages(result.messages);
        };

        fetchMessages();

        let channel: ReturnType<typeof supabase.channel> | null = null;
        let refreshTimer: ReturnType<typeof setInterval> | null = null;
        let disposed = false;

        const getClerkToken = async (): Promise<string | null> => {
            try {
                // @ts-expect-error Clerk is injected on window by the Clerk frontend runtime.
                return (await window.Clerk?.session?.getToken()) ?? null;
            } catch {
                return null;
            }
        };

        // Realtime Subscription for new messages. The websocket must carry the
        // Clerk token: postgres_changes events are filtered by RLS for the
        // subscriber, and without it the socket is anon (no events). Clerk
        // session tokens expire after ~60s, so re-auth while the conversation
        // stays open.
        (async () => {
            const token = await getClerkToken();
            if (disposed) return;
            if (token) supabase.realtime.setAuth(token);
            refreshTimer = setInterval(async () => {
                const t = await getClerkToken();
                if (t && !disposed) supabase.realtime.setAuth(t);
            }, 50_000);

            channel = supabase
                .channel(`conversation:${conversationId}`)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "messages",
                        filter: `conversation_id=eq.${conversationId}`
                    },
                    (payload) => {
                        const incoming = payload.new as ChatMessage;
                        setMessages((prev) => {
                            // Avoid duplicates (from optimistic update)
                            if (prev.some(m => m.id === incoming.id)) return prev;
                            return [...prev, incoming];
                        });
                    }
                )
                .subscribe();
        })();

        return () => {
            disposed = true;
            if (refreshTimer) clearInterval(refreshTimer);
            if (channel) supabase.removeChannel(channel);
        };
    }, [conversationId, supabase]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() || sending) return;
        setSending(true);

        const content = newMessage.trim();
        setNewMessage("");

        // Show the bubble immediately, reconcile once the server answers — the
        // send round-trip goes out to Meta and is far too slow to stare at an
        // empty composer.
        const tempId = `temp-${Date.now()}`;
        setMessages((prev) => [
            ...prev,
            { id: tempId, content, sender_type: "agent", created_at: new Date().toISOString(), pending: true },
        ]);

        const result = await sendMessageAction(conversationId, content);

        setMessages((prev) => {
            const withoutTemp = prev.filter((m) => m.id !== tempId);
            if (!result.message) return withoutTemp;
            // Realtime may have delivered it first.
            if (withoutTemp.some((m) => m.id === result.message.id)) return withoutTemp;
            return [...withoutTemp, result.message];
        });

        // Swallowing this is why a blocked send (expired trial) looked like the
        // message had simply vanished.
        if (result.error) {
            toast.error(result.error);
            setNewMessage(content);
        }

        setSending(false);
    };

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                    {/* Mobile back button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden h-8 w-8 -ml-1 shrink-0"
                        onClick={() => router.push(pathname)}
                        aria-label={tc('back')}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={customerAvatar} />
                        <AvatarFallback>{customerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-semibold text-sm">{customerName}</h3>
                        {platform ? (
                            <div className="flex items-center gap-1.5">
                                <span className={cn("flex items-center justify-center h-4 w-4 rounded-full", platform.colorClass)}>
                                    <PlatformIcon className="h-2.5 w-2.5" />
                                </span>
                                <span className="text-xs text-muted-foreground">{channelPlatform === 'website' ? t('website') : platformLabelKeys[channelPlatform!] || channelPlatform}</span>
                            </div>
                        ) : (
                            <p className="text-xs text-green-500 flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                {t('online')}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 bg-muted/20">
                {rows.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center gap-1">
                        <MessageCircle className="h-8 w-8 text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground">{t('noMessages')}</p>
                        <p className="text-xs text-muted-foreground/70">{t('startConversation')}</p>
                    </div>
                ) : (
                    <div className="mx-auto w-full max-w-3xl">
                        {rows.map((row) => {
                            if (row.kind === "date") {
                                return (
                                    <div key={row.key} className="flex justify-center py-4">
                                        <span className="px-3 py-1 rounded-full bg-background/80 border border-border text-[11px] font-medium text-muted-foreground shadow-sm">
                                            {dayLabel(row.date)}
                                        </span>
                                    </div>
                                );
                            }

                            if (row.kind === "system") {
                                return (
                                    <div key={row.key} className="flex justify-center py-2">
                                        <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                                            {row.message.content}
                                        </span>
                                    </div>
                                );
                            }

                            const { outgoing } = row;

                            return (
                                <div
                                    key={row.key}
                                    className={cn("flex gap-2 pt-3", outgoing ? "justify-end" : "justify-start")}
                                >
                                    {/* Avatar anchors the incoming stack; outgoing needs no identity marker. */}
                                    {!outgoing && (
                                        <Avatar className="h-7 w-7 shrink-0 self-end mb-0.5 border border-border">
                                            <AvatarImage src={customerAvatar} />
                                            <AvatarFallback className="text-[10px]">
                                                {customerName.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    )}

                                    <div
                                        className={cn(
                                            "flex flex-col gap-0.5 min-w-0 max-w-[min(80%,34rem)]",
                                            outgoing && "items-end"
                                        )}
                                    >
                                        {row.messages.map((msg, index) => {
                                            const isLast = index === row.messages.length - 1;
                                            return (
                                                <div
                                                    key={msg.id}
                                                    title={format(new Date(msg.created_at), "PPpp", dateOpts)}
                                                    className={cn(
                                                        "w-fit max-w-full px-3 py-2 text-sm rounded-2xl transition-opacity",
                                                        outgoing
                                                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                                                            : "bg-card border border-border shadow-sm",
                                                        // Tail only on the last bubble, so a stack reads as one turn.
                                                        isLast && (outgoing ? "rounded-br-md" : "rounded-bl-md"),
                                                        msg.pending && "opacity-70"
                                                    )}
                                                >
                                                    {/* Time sits in flow beside the text rather than absolutely
                                                        positioned over it — that overlap is what made short
                                                        messages unreadable. */}
                                                    <div className="flex items-end gap-2">
                                                        <span className="whitespace-pre-wrap break-words min-w-0">
                                                            {msg.content}
                                                        </span>
                                                        {isLast && (
                                                            <span
                                                                className={cn(
                                                                    "shrink-0 flex items-center gap-0.5 text-[10px] tabular-nums translate-y-[1px]",
                                                                    outgoing ? "text-primary-foreground/70" : "text-muted-foreground"
                                                                )}
                                                            >
                                                                {format(new Date(msg.created_at), "HH:mm")}
                                                                {outgoing &&
                                                                    (msg.pending ? (
                                                                        <Loader2 className="h-3 w-3 animate-spin" aria-label={t('sending')} />
                                                                    ) : (
                                                                        <Check className="h-3 w-3" aria-label={t('sent')} />
                                                                    ))}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-card border-t border-border">
                <div className="flex items-end gap-2 bg-muted/30 p-2 rounded-xl border border-border focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary shrink-0 rounded-lg">
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={t('writeMessage')}
                        className="min-h-[40px] max-h-[120px] bg-transparent border-none focus-visible:ring-0 resize-none py-3 text-sm"
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        size="icon"
                        className="h-10 w-10 bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 rounded-lg shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:shadow-none"
                    >
                        <Send className="h-5 w-5 ml-0.5" />
                    </Button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-muted-foreground">
                        {t('enterToSend')}
                    </p>
                </div>
            </div>
        </div>
    );
}
