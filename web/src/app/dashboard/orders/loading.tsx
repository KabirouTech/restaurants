import { ChefHat } from "lucide-react";

export default function OrdersLoading() {
    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <div className="flex items-center gap-2 text-primary font-medium mb-1">
                        <ChefHat className="h-5 w-5" />
                        <span>Gestion</span>
                    </div>
                    <h1 className="text-3xl font-bold font-serif text-foreground">Devis & Commandes</h1>
                    <p className="text-muted-foreground mt-1">Gérez vos événements, devis et facturations.</p>
                </div>
                <div className="h-10 w-36 bg-primary/20 animate-pulse rounded-md" />
            </div>

            {/* Kanban Board Skeleton */}
            <div className="flex gap-4 overflow-x-auto pb-4 pt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-80 flex flex-col gap-3 bg-muted/10 rounded-xl p-3 border border-border">
                        <div className="flex justify-between items-center px-1 mb-1">
                            <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                            <div className="h-5 w-8 bg-muted animate-pulse rounded-full" />
                        </div>
                        {Array.from({ length: i % 2 === 0 ? 3 : 2 }).map((_, j) => (
                            <div key={j} className="bg-card p-4 rounded-lg border border-border/50 shadow-sm space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="h-4 w-16 bg-primary/20 animate-pulse rounded" />
                                        <div className="h-4 w-12 bg-muted/80 animate-pulse rounded" />
                                    </div>
                                    <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                                </div>

                                <div className="space-y-2">
                                    <div className="h-3 w-1/2 bg-muted/60 animate-pulse rounded" />
                                    <div className="h-3 w-2/3 bg-muted/60 animate-pulse rounded" />
                                </div>

                                <div className="flex items-center gap-3 pt-2">
                                    <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
                                    <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
