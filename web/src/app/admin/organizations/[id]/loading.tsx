export default function OrgDetailLoading() {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <header className="h-14 md:h-20 bg-background/80 backdrop-blur border-b border-border flex items-center px-4 md:px-8 z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="h-5 w-5 bg-muted animate-pulse rounded" />
                    <div>
                        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-24 bg-muted/60 animate-pulse rounded mt-1" />
                    </div>
                    <div className="h-5 w-12 bg-muted animate-pulse rounded-full" />
                    <div className="h-5 w-12 bg-muted animate-pulse rounded-full" />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {/* Stats Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm">
                            <div className="w-12 h-12 rounded-full bg-muted animate-pulse shrink-0" />
                            <div className="space-y-2 flex-1">
                                <div className="h-3 w-20 bg-muted/80 animate-pulse rounded" />
                                <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Actions Skeleton */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-8">
                    <div className="h-5 w-20 bg-muted animate-pulse rounded mb-4" />
                    <div className="flex gap-3">
                        <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
                        <div className="h-10 w-32 bg-muted animate-pulse rounded-lg" />
                    </div>
                </div>

                {/* Settings Skeleton */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-6 mb-6">
                    <div className="h-5 w-36 bg-muted animate-pulse rounded mb-4" />
                    <div className="bg-muted/50 rounded-lg h-32 animate-pulse" />
                </div>

                {/* Info Skeleton */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                    <div className="h-5 w-28 bg-muted animate-pulse rounded mb-4" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="h-3 w-8 bg-muted/60 animate-pulse rounded" />
                            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 w-16 bg-muted/60 animate-pulse rounded" />
                            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
