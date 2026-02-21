export default function AdminLoading() {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <header className="h-20 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-8 z-10 shrink-0">
                <div>
                    <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-64 bg-muted/60 animate-pulse rounded mt-2" />
                </div>
            </header>

            {/* Stats Row */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm">
                            <div className="w-12 h-12 rounded-full bg-muted animate-pulse shrink-0" />
                            <div className="space-y-2 flex-1">
                                <div className="h-3 w-20 bg-muted/80 animate-pulse rounded" />
                                <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-card rounded-xl border border-border shadow-sm h-80 animate-pulse" />
                    </div>
                    <div>
                        <div className="bg-card rounded-xl border border-border shadow-sm h-80 animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}
