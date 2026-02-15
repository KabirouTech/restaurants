"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Phone, MoreHorizontal, Send, Image as ImageIcon, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MOCK_CONVERSATIONS, type Conversation } from "./data";

interface InboxChatProps {
    conversationId: string;
}

export default function InboxChat({ conversationId }: InboxChatProps) {
    const conversation = MOCK_CONVERSATIONS.find(c => c.id === conversationId);

    // Simple state to handle message sending for demo
    const [messages, setMessages] = useState(conversation?.messages || []);

    if (!conversation) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium">Sélectionnez une conversation</h3>
                <p className="text-sm">Connectez WhatsApp et Instagram pour recevoir vos messages ici.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background relative overflow-hidden">
            {/* Header */}
            <div className="border-b border-border/50 p-4 flex items-center justify-between bg-card z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{conversation.clientName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-semibold text-foreground font-serif text-lg leading-none">{conversation.clientName}</h3>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            {conversation.platform === "whatsapp" ? (
                                <span className="flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span> WhatsApp
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-fuchsia-600 font-medium bg-fuchsia-50 px-1.5 py-0.5 rounded-full">
                                    <span className="h-1.5 w-1.5 bg-fuchsia-500 rounded-full"></span> Instagram
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground">
                        <Phone className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Messages Area - Teranga Details */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
                <div className="flex justify-center my-4">
                    <span className="text-xs text-muted-foreground bg-white border border-border px-3 py-1 rounded-full shadow-sm">Aujourd'hui</span>
                </div>
                {messages.map((msg, i) => {
                    const isMe = msg.sender === "me";
                    const isNextMine = messages[i + 1]?.sender === msg.sender;

                    return (
                        <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                            <div className={cn(
                                "max-w-[75%] px-4 py-2.5 shadow-sm text-sm relative group transition-all hover:shadow-md",
                                isMe
                                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                                    : "bg-white border border-border text-foreground rounded-2xl rounded-tl-sm"
                            )}>
                                <p className="leading-relaxed">{msg.text}</p>
                                <span className={cn(
                                    "text-[10px] absolute bottom-1 block opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap",
                                    isMe ? "right-2 text-primary-foreground/70" : "left-2 text-muted-foreground"
                                )}>
                                    {msg.timestamp}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-background border-t border-border mt-auto">
                <div className="flex gap-2 items-end bg-muted/20 p-2 rounded-xl border border-border focus-within:ring-2 ring-primary/20 transition-all">
                    <Button size="icon" variant="ghost" className="text-muted-foreground hover:bg-muted/50 rounded-lg shrink-0 h-10 w-10">
                        <ImageIcon className="h-5 w-5" />
                    </Button>
                    <input
                        className="flex-1 bg-transparent border-none focus:outline-none min-h-[40px] py-2 px-1 text-sm placeholder:text-muted-foreground/70 resize-none"
                        placeholder="Écrivez votre message..."
                    />
                    <Button size="icon" variant="ghost" className="text-muted-foreground hover:bg-muted/50 rounded-lg shrink-0 h-10 w-10 mr-1">
                        <Smile className="h-5 w-5" />
                    </Button>
                    <Button size="icon" className="h-10 w-10 shrink-0 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-muted-foreground">
                        En envoyant ce message, vous acceptez les conditions de {conversation.platform === 'whatsapp' ? 'WhatsApp Business' : 'Meta'}.
                    </p>
                </div>
            </div>
        </div>
    );
}
