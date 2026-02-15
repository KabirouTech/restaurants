"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Search, Filter, Phone, Mail, Instagram, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Conversation {
    id: string;
    customer_id: string;
    last_message_at: string;
    unread_count: number;
    customers: {
        full_name: string;
        avatar_url?: string;
    };
    channels: {
        platform: string;
    };
    messages: {
        content: string;
    }[];
}

interface InboxSidebarProps {
    conversations: Conversation[];
    className?: string;
}

export function InboxSidebar({ conversations, className }: InboxSidebarProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const selectedId = searchParams.get("conversationId");

    const handleSelect = (id: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("conversationId", id);
        router.push(`${pathname}?${params.toString()}`);
    };

    const getIcon = (platform: string) => {
        switch (platform) {
            case 'whatsapp': return <Phone className="h-3 w-3" />;
            case 'instagram': return <Instagram className="h-3 w-3" />;
            case 'email': return <Mail className="h-3 w-3" />;
            default: return <MessageCircle className="h-3 w-3" />;
        }
    };

    return (
        <div className={cn("flex flex-col h-full border-r border-border bg-card/50", className)}>
            {/* Header */}
            <div className="p-4 border-b border-border space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-serif font-bold text-foreground">Discussions</h2>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher..."
                        className="pl-9 bg-background/50 border-input/50 focus-visible:ring-primary/20"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                        Aucune conversation
                    </div>
                ) : (
                    conversations.map((conv) => {
                        const lastMsg = conv.messages?.[0]?.content || "Nouvelle conversation";
                        const isSelected = selectedId === conv.id;

                        return (
                            <button
                                key={conv.id}
                                onClick={() => handleSelect(conv.id)}
                                className={cn(
                                    "w-full text-left p-4 flex gap-3 transition-colors border-b border-border/40 hover:bg-accent/50 group relative",
                                    isSelected && "bg-accent text-accent-foreground"
                                )}
                            >
                                <Avatar className="h-10 w-10 border border-border">
                                    <AvatarImage src={conv.customers?.avatar_url} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                        {conv.customers?.full_name?.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-semibold text-sm truncate pr-2">
                                            {conv.customers?.full_name}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                                            {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true, locale: fr })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className={cn(
                                            "flex items-center justify-center h-4 w-4 rounded-full bg-muted text-muted-foreground shrink-0",
                                            conv.channels?.platform === 'whatsapp' && "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
                                            conv.channels?.platform === 'instagram' && "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
                                        )}>
                                            {getIcon(conv.channels?.platform)}
                                        </span>
                                        <p className={cn(
                                            "text-xs truncate text-muted-foreground group-hover:text-foreground transition-colors",
                                            conv.unread_count > 0 && "font-medium text-foreground"
                                        )}>
                                            {lastMsg}
                                        </p>
                                    </div>
                                </div>

                                {conv.unread_count > 0 && (
                                    <div className="absolute right-4 top-1/2 mt-3 h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
                                )}
                                {isSelected && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
