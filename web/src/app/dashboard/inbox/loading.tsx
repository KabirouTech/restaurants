import { Search } from "lucide-react";

export default function InboxLoading() {
    return (
        <div className="flex h-[calc(100vh-theme(spacing.2))] max-h-[800px] border border-border rounded-xl bg-background overflow-hidden relative shadow-sm">

            {/* Sidebar List Skeleton */}
            <div className="w-full md:w-80 shrink-0 flex flex-col border-r border-border bg-card/50">
                <div className="p-4 border-b border-border space-y-4 shrink-0">
                    <h2 className="text-xl font-serif font-bold text-foreground">Discussions</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                        <div className="h-9 w-full bg-muted/60 animate-pulse rounded-md" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto w-full">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex gap-3 p-4 border-b border-border/50 items-start">
                            <div className="h-10 w-10 bg-muted animate-pulse rounded-full shrink-0" />
                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex justify-between items-center">
                                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                    <div className="h-3 w-10 bg-muted/60 animate-pulse rounded" />
                                </div>
                                <div className="h-3 w-full bg-muted/60 animate-pulse rounded" />
                                <div className="h-3 w-4/5 bg-muted/60 animate-pulse rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area Skeleton */}
            <div className="flex-1 hidden md:flex flex-col bg-muted/10 relative">
                {/* Chat Header Skeleton */}
                <div className="h-16 px-6 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted animate-pulse rounded-full shrink-0" />
                        <div className="space-y-1.5">
                            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                            <div className="h-3 w-16 bg-muted/50 animate-pulse rounded" />
                        </div>
                    </div>
                </div>

                {/* Messages Skeleton */}
                <div className="flex-1 p-6 space-y-6 overflow-hidden flex flex-col justify-end">
                    <div className="flex gap-3 justify-start">
                        <div className="h-8 w-8 bg-muted animate-pulse rounded-full shrink-0" />
                        <div className="h-16 w-64 bg-muted/40 animate-pulse rounded-2xl rounded-tl-sm" />
                    </div>
                    <div className="flex gap-3 justify-end">
                        <div className="h-12 w-48 bg-primary/20 animate-pulse rounded-2xl rounded-tr-sm" />
                    </div>
                    <div className="flex gap-3 justify-start">
                        <div className="h-8 w-8 bg-muted animate-pulse rounded-full shrink-0" />
                        <div className="h-20 w-72 bg-muted/40 animate-pulse rounded-2xl rounded-tl-sm" />
                    </div>
                    <div className="flex gap-3 justify-end">
                        <div className="h-10 w-40 bg-primary/20 animate-pulse rounded-2xl rounded-tr-sm" />
                    </div>
                </div>

                {/* Input Area Skeleton */}
                <div className="p-4 border-t border-border bg-card shrink-0">
                    <div className="flex items-end gap-2 p-2 px-3 border border-input bg-background rounded-xl">
                        <div className="flex-1 min-h-[40px] flex items-center">
                            <div className="h-4 w-32 bg-muted/50 animate-pulse rounded" />
                        </div>
                        <div className="h-8 w-8 bg-muted animate-pulse rounded-full shrink-0 mb-1" />
                    </div>
                </div>
            </div>

        </div>
    );
}
