export default function AnnouncementsLoading() {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <header className="h-20 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-8 z-10 shrink-0">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="h-7 w-7 bg-orange-500/20 animate-pulse rounded" />
                        <div className="h-8 w-28 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-4 w-20 bg-muted/60 animate-pulse rounded mt-2" />
                </div>
                <div className="h-10 w-44 bg-muted animate-pulse rounded-full" />
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {/* List Skeleton */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="divide-y divide-border">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4">
                                <div className="w-4 h-4 bg-muted/60 animate-pulse rounded" />
                                <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-full max-w-md bg-muted animate-pulse rounded" />
                                    <div className="h-3 w-2/3 max-w-xs bg-muted/60 animate-pulse rounded" />
                                </div>
                                <div className="h-4 w-16 bg-muted/60 animate-pulse rounded" />
                                <div className="h-6 w-11 bg-muted animate-pulse rounded-full" />
                                <div className="flex gap-1">
                                    <div className="w-8 h-8 bg-muted/60 animate-pulse rounded" />
                                    <div className="w-8 h-8 bg-muted/60 animate-pulse rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
