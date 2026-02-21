"use client";

import { useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Search, Filter, Phone, Mail, Instagram, MessageCircle, Globe, X } from "lucide-react";

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

const platformFilters = [
    { value: "all", label: "Tous", icon: MessageCircle },
    { value: "whatsapp", label: "WhatsApp", icon: Phone },
    { value: "instagram", label: "Instagram", icon: Instagram },
    { value: "email", label: "Email", icon: Mail },
    { value: "website", label: "Site Web", icon: Globe },
];

export function InboxSidebar({ conversations, className }: InboxSidebarProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const selectedId = searchParams.get("conversationId");

    const [platformFilter, setPlatformFilter] = useState("all");
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

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
            case 'website': return <Globe className="h-3 w-3" />;
            default: return <MessageCircle className="h-3 w-3" />;
        }
    };

    const filteredConversations = conversations.filter((conv) => {
        // Platform filter
        if (platformFilter !== "all" && conv.channels?.platform !== platformFilter) {
            return false;
        }
        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const nameMatch = conv.customers?.full_name?.toLowerCase().includes(q);
            const msgMatch = conv.messages?.[0]?.content?.toLowerCase().includes(q);
            if (!nameMatch && !msgMatch) return false;
        }
        return true;
    });

    return (
        <div className={cn("flex flex-col h-full border-r border-border bg-card/50", className)}>
            {/* Header */}
            <div className="p-4 border-b border-border space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-serif font-bold text-foreground">Discussions</h2>
                    <Button
                        variant={showFilters ? "secondary" : "ghost"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        {showFilters ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                </div>

                {/* Platform Filter Pills */}
                {showFilters && (
                    <div className="flex flex-wrap gap-1.5">
                        {platformFilters.map((f) => {
                            const Icon = f.icon;
                            const isActive = platformFilter === f.value;
                            return (
                                <button
                                    key={f.value}
                                    onClick={() => setPlatformFilter(f.value)}
                                    className={cn(
                                        "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors border",
                                        isActive
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background text-muted-foreground border-border hover:bg-accent"
                                    )}
                                >
                                    <Icon className="h-3 w-3" />
                                    {f.label}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-background/50 border-input/50 focus-visible:ring-primary/20"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                        {platformFilter !== "all" ? "Aucune conversation pour ce canal" : "Aucune conversation"}
                    </div>
                ) : (
                    filteredConversations.map((conv) => {
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
                                            conv.channels?.platform === 'instagram' && "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
                                            conv.channels?.platform === 'email' && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                                            conv.channels?.platform === 'website' && "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
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
