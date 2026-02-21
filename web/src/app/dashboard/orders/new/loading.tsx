import { ChefHat } from "lucide-react";

export default function NewOrderLoading() {
    return (
        <div className="h-screen flex flex-col bg-background text-foreground animate-in fade-in duration-500 overflow-hidden">
            {/* Minimal Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-primary" />
                    <h1 className="text-xl font-bold font-serif text-foreground">Nouveau Devis</h1>
                </div>
            </header>

            {/* Main Content Skeleton */}
            <main className="flex-1 overflow-hidden p-6 bg-muted/10">
                <div className="h-full flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
                    {/* Left Column (Details) */}
                    <div className="w-full md:w-[45%] flex flex-col gap-6 overflow-y-auto pr-2">
                        {/* Client Details Card */}
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-4">
                            <div className="h-6 w-32 bg-muted animate-pulse rounded mb-4" />
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                                    <div className="h-10 w-full bg-muted/50 animate-pulse rounded-md border border-border" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                    <div className="h-10 w-full bg-muted/50 animate-pulse rounded-md border border-border" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                                    <div className="h-10 w-full bg-muted/50 animate-pulse rounded-md border border-border" />
                                </div>
                            </div>
                        </div>

                        {/* Event Details Card */}
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-4">
                            <div className="h-6 w-40 bg-muted animate-pulse rounded mb-4" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                                    <div className="h-10 w-full bg-muted/50 animate-pulse rounded-md border border-border" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                                    <div className="h-10 w-full bg-muted/50 animate-pulse rounded-md border border-border" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                <div className="h-10 w-full bg-muted/50 animate-pulse rounded-md border border-border" />
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Menu Items) */}
                    <div className="flex-1 flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/30">
                            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex gap-4 items-center p-3 border border-border/50 rounded-xl">
                                    <div className="h-16 w-24 bg-muted animate-pulse rounded-md" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                                        <div className="h-3 w-48 bg-muted/60 animate-pulse rounded" />
                                    </div>
                                    <div className="h-8 w-24 bg-muted animate-pulse rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
