"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { format } from "date-fns";
import { Send, Paperclip, MoreVertical, Phone, Instagram, Mail, Globe, MessageCircle } from "lucide-react";
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

const platformConfig: Record<string, { icon: typeof Phone; label: string; colorClass: string }> = {
    whatsapp: { icon: Phone, label: "WhatsApp", colorClass: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
    instagram: { icon: Instagram, label: "Instagram", colorClass: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" },
    email: { icon: Mail, label: "Email", colorClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    website: { icon: Globe, label: "Site Web", colorClass: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" },
};

export function ChatWindow({ conversationId, customerName, customerAvatar, channelPlatform }: ChatWindowProps) {
    const supabase = createClient();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const platform = channelPlatform ? platformConfig[channelPlatform] : null;
    const PlatformIcon = platform?.icon || MessageCircle;

    useEffect(() => {
        // Fetch existing messages via server action
        const fetchMessages = async () => {
            const result = await fetchMessagesAction(conversationId);
            if (result.messages) setMessages(result.messages);
        };

        fetchMessages();

        // Realtime Subscription for new messages
        const channel = supabase
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
                    setMessages((prev) => {
                        // Avoid duplicates (from optimistic update)
                        if (prev.some(m => m.id === payload.new.id)) return prev;
                        return [...prev, payload.new];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
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

        const result = await sendMessageAction(conversationId, content);

        if (result.message) {
            // Add message if not already added by realtime
            setMessages((prev) => {
                if (prev.some(m => m.id === result.message.id)) return prev;
                return [...prev, result.message];
            });
        }

        setSending(false);
    };

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
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
                                <span className="text-xs text-muted-foreground">{platform.label}</span>
                            </div>
                        ) : (
                            <p className="text-xs text-green-500 flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                En ligne
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
                {messages.map((msg) => {
                    const isAgent = msg.sender_type === "agent" || msg.sender_type === "system";
                    const isSystem = msg.sender_type === "system";

                    if (isSystem) {
                        return (
                            <div key={msg.id} className="flex justify-center my-4">
                                <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                                    {msg.content}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex w-full max-w-[80%]",
                                isAgent ? "ml-auto justify-end" : "mr-auto justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "p-3 rounded-2xl shadow-sm text-sm relative group",
                                    isAgent
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-card border border-border rounded-tl-none"
                                )}
                            >
                                <p>{msg.content}</p>
                                <span className={cn(
                                    "text-[10px] absolute bottom-1 right-2 opacity-60",
                                    isAgent ? "text-primary-foreground" : "text-muted-foreground"
                                )}>
                                    {msg.created_at ? format(new Date(msg.created_at), "HH:mm") : ""}
                                </span>
                            </div>
                        </div>
                    );
                })}
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
                        placeholder="Écrivez un message..."
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
                        Entrée pour envoyer · Shift + Entrée pour nouvelle ligne
                    </p>
                </div>
            </div>
        </div>
    );
}
