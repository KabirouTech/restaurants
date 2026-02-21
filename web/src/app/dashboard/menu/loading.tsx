import { ChefHat } from "lucide-react";

export default function MenuLoading() {
    return (
        <div className="min-h-screen p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <div className="flex items-center gap-2 text-primary font-medium mb-1">
                        <ChefHat className="h-5 w-5" />
                        <span>Carte & Menus</span>
                    </div>
                    <h1 className="text-3xl font-bold font-serif text-foreground">
                        Gestion du Menu
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Ajoutez, modifiez ou supprimez vos plats. Ils apparaîtront instantanément sur vos devis.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="h-10 w-28 bg-muted animate-pulse rounded-md" />
                    <div className="h-10 w-32 bg-primary/20 animate-pulse rounded-md" />
                </div>
            </div>

            {/* Skeleton Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-4 gap-3">
                    <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-8 w-20 bg-muted animate-pulse rounded-md" />
                </div>

                <div className="max-h-[calc(100vh-260px)] overflow-hidden pr-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-2">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex flex-col border border-border rounded-xl overflow-hidden shadow-sm bg-card">
                                <div className="aspect-video bg-muted animate-pulse" />
                                <div className="p-4 space-y-3 bg-card">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="h-5 bg-muted/80 animate-pulse rounded w-2/3" />
                                        <div className="h-5 bg-primary/20 animate-pulse rounded w-1/4" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-3 bg-muted/60 animate-pulse rounded w-full" />
                                        <div className="h-3 bg-muted/60 animate-pulse rounded w-4/5" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
