export default function BannersLoading() {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <header className="h-14 md:h-20 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="h-7 w-7 bg-orange-500/20 animate-pulse rounded" />
                        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-4 w-24 bg-muted/60 animate-pulse rounded mt-2" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-8 w-16 bg-muted/60 animate-pulse rounded" />
                    <div className="h-10 w-44 bg-muted animate-pulse rounded-full" />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {/* Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="h-40 bg-muted animate-pulse" />
                            <div className="p-4 space-y-3">
                                <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                                <div className="h-3 w-full bg-muted/60 animate-pulse rounded" />
                                <div className="h-3 w-2/3 bg-muted/60 animate-pulse rounded" />
                            </div>
                            <div className="border-t border-border p-3 flex justify-end gap-2">
                                <div className="h-8 w-24 bg-muted/60 animate-pulse rounded" />
                                <div className="h-8 w-24 bg-muted/60 animate-pulse rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
