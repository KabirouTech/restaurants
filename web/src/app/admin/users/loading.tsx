export default function UsersLoading() {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <header className="h-14 md:h-20 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="h-7 w-7 bg-orange-500/20 animate-pulse rounded" />
                        <div className="h-8 w-36 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-4 w-24 bg-muted/60 animate-pulse rounded mt-2" />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {/* Filters Skeleton */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="h-10 flex-1 max-w-md bg-muted animate-pulse rounded-lg" />
                    <div className="h-10 w-36 bg-muted animate-pulse rounded-lg" />
                </div>

                {/* Table Skeleton */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    {/* Table Header */}
                    <div className="flex items-center gap-6 px-6 py-4 border-b border-border bg-muted/50">
                        <div className="w-4 h-4 bg-muted animate-pulse rounded" />
                        {[100, 60, 100, 80, 80, 60].map((w, i) => (
                            <div key={i} className="h-3 bg-muted animate-pulse rounded" style={{ width: w }} />
                        ))}
                    </div>
                    {/* Table Rows */}
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-6 px-6 py-4 border-b border-border">
                            <div className="w-4 h-4 bg-muted/60 animate-pulse rounded" />
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
                                <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                            </div>
                            <div className="h-5 w-14 bg-muted animate-pulse rounded-full" />
                            <div className="h-4 w-24 bg-muted/60 animate-pulse rounded" />
                            <div className="h-4 w-16 bg-muted/60 animate-pulse rounded" />
                            <div className="h-4 w-20 bg-muted/60 animate-pulse rounded" />
                            <div className="flex gap-1">
                                <div className="w-8 h-8 bg-muted/60 animate-pulse rounded" />
                                <div className="w-8 h-8 bg-muted/60 animate-pulse rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
