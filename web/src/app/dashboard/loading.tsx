import { Search, Plus, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLoading() {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <header className="h-20 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-8 z-10 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-foreground">Tableau de bord</h1>
                    <p className="text-sm text-muted-foreground font-light">Bonjour, voici le programme culinaire du jour.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative hidden lg:block">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <div className="h-[42px] w-64 bg-muted/60 animate-pulse rounded-full" />
                    </div>
                    <Button variant="outline" className="hidden sm:flex items-center gap-2 rounded-full border-muted text-muted-foreground h-10 px-5" disabled>
                        <Ban className="h-4 w-4" />
                        Fermer une date
                    </Button>
                    <Button className="flex items-center gap-2 rounded-full bg-primary/50 text-white/50 h-10 px-5" disabled>
                        <Plus className="h-4 w-4" />
                        Créer un devis
                    </Button>
                </div>
            </header>

            {/* Main Scrollable Content Skeleton */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {/* Stats Row */}
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
                    {/* Left Column (2/3) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Capacity Overview Skeleton */}
                        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                                <div className="h-8 w-32 bg-muted/60 animate-pulse rounded-md" />
                            </div>
                            <div className="p-6">
                                <div className="space-y-5">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="grid grid-cols-12 gap-4 items-center">
                                            <div className="col-span-2 h-4 bg-muted animate-pulse rounded w-16" />
                                            <div className="col-span-9 h-3 bg-muted/50 animate-pulse rounded-full" />
                                            <div className="col-span-1 h-3 bg-muted animate-pulse rounded w-8 ml-auto" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Recent Orders Table Skeleton */}
                        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                                <div className="h-6 w-56 bg-muted animate-pulse rounded" />
                                <div className="h-5 w-20 bg-muted/60 animate-pulse rounded" />
                            </div>
                            <div className="p-6 space-y-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex gap-4 items-center pb-4 border-b border-border/50">
                                        <div className="w-9 h-9 border border-border rounded-full bg-muted animate-pulse shrink-0" />
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                                            <div className="h-3 w-48 bg-muted/60 animate-pulse rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column (1/3) */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Messages Widget Skeleton */}
                        <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col h-[500px]">
                            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                                <div className="h-6 w-40 bg-muted animate-pulse rounded" />
                            </div>
                            <div className="flex-1 p-4 space-y-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="p-4 bg-card border border-border/50 rounded-xl flex gap-3">
                                        <div className="w-7 h-7 rounded-full bg-muted animate-pulse shrink-0" />
                                        <div className="space-y-2 flex-1">
                                            <div className="flex justify-between">
                                                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                                <div className="h-3 w-10 bg-muted/60 animate-pulse rounded" />
                                            </div>
                                            <div className="h-3 w-full bg-muted/40 animate-pulse rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Promo Skeleton */}
                        <div className="rounded-xl h-40 bg-muted animate-pulse border border-border" />
                    </div>
                </div>
            </div>
        </div>
    );
}
