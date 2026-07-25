export default function WebhooksLoading() {
    return (
        <div className="flex flex-col min-h-full bg-background text-foreground font-sans animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <header className="border-b border-border px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-orange-500/20 animate-pulse rounded" />
                        <div className="h-7 w-32 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-3 w-48 bg-muted/60 animate-pulse rounded mt-2" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-8 w-44 bg-muted animate-pulse rounded-lg" />
                    <div className="h-8 w-16 bg-muted/60 animate-pulse rounded-lg" />
                    <div className="h-8 w-8 bg-muted/60 animate-pulse rounded-lg" />
                </div>
            </header>

            <div className="p-4 md:p-8 space-y-6 w-full max-w-7xl">
                {/* KPI Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-card rounded-xl border border-border p-4 shadow-sm">
                            <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                            <div className="h-7 w-12 bg-muted animate-pulse rounded mt-2" />
                            <div className="h-2.5 w-20 bg-muted/60 animate-pulse rounded mt-1.5" />
                        </div>
                    ))}
                </div>

                {/* Chart Skeleton */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-4 md:p-5">
                    <div className="h-4 w-28 bg-muted animate-pulse rounded mb-4" />
                    <div className="flex items-end gap-[2px] h-28">
                        {Array.from({ length: 24 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-muted animate-pulse rounded-sm"
                                style={{ height: `${20 + ((i * 37) % 70)}%` }}
                            />
                        ))}
                    </div>
                </div>

                {/* Provider cards Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-card rounded-xl border border-border p-4 shadow-sm">
                            <div className="h-4 w-20 bg-muted animate-pulse rounded-full" />
                            <div className="h-6 w-14 bg-muted animate-pulse rounded mt-2" />
                            <div className="h-2.5 w-40 bg-muted/60 animate-pulse rounded mt-1.5" />
                            <div className="h-1.5 w-full bg-muted animate-pulse rounded-full mt-3" />
                        </div>
                    ))}
                </div>

                {/* Event stream Skeleton */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden divide-y divide-border">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3">
                            <div className="h-3.5 w-3.5 bg-muted/60 animate-pulse rounded" />
                            <div className="h-4 w-[76px] bg-muted animate-pulse rounded-full" />
                            <div className="h-3 flex-1 bg-muted/60 animate-pulse rounded" />
                            <div className="h-4 w-[70px] bg-muted animate-pulse rounded-full" />
                            <div className="h-3 w-20 bg-muted/60 animate-pulse rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
