import { Loader2, MessageSquare } from "lucide-react";

export default function InboxLoading() {
    return (
        <div className="flex h-[calc(100vh-theme(spacing.2))] max-h-[800px] border border-border rounded-xl bg-background overflow-hidden shadow-sm">
            <div className="w-full md:w-80 shrink-0 flex flex-col border-r border-border bg-card/50">
                <div className="p-4 border-b border-border">
                    <h2 className="text-xl font-serif font-bold text-foreground">Discussions</h2>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            </div>
            <div className="flex-1 hidden md:flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">Chargement...</p>
            </div>
        </div>
    );
}
