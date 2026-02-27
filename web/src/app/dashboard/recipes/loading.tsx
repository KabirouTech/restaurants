import { BookOpen, Plus, Search } from "lucide-react";

export default function RecipesLoading() {
    return (
        <div className="flex flex-col min-h-screen pb-24">
            {/* Header sticky */}
            <div className="sticky top-0 z-40 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-border shadow-sm p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[1600px] mx-auto">
                    <div>
                        <div className="flex items-center gap-2 text-primary font-medium mb-1">
                            <BookOpen className="h-5 w-5" />
                            <span>Recettes</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold font-serif">Mes Recettes</h1>
                        <div className="h-4 w-40 bg-muted animate-pulse rounded mt-1" />
                    </div>
                    <div className="h-10 w-40 bg-primary/20 animate-pulse rounded-md" />
                </div>
            </div>

            <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full">
                {/* Barre recherche */}
                <div className="relative mb-6 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                    <div className="h-10 w-full bg-card border border-border rounded-md animate-pulse" />
                </div>

                {/* Grille de cartes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                            {/* Image placeholder */}
                            <div className="aspect-video bg-muted animate-pulse relative">
                                {/* badges top */}
                                <div className="absolute top-2 left-2 flex gap-1.5">
                                    {i % 3 === 0 && (
                                        <div className="h-5 w-14 bg-black/20 animate-pulse rounded-full" />
                                    )}
                                </div>
                                {/* catégorie bottom */}
                                <div className="absolute bottom-2 left-2 h-5 w-20 bg-black/20 animate-pulse rounded" />
                            </div>

                            {/* Contenu */}
                            <div className="p-4 space-y-2">
                                <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                                <div className="h-3 w-full bg-muted/60 animate-pulse rounded" />
                                <div className="h-3 w-4/5 bg-muted/60 animate-pulse rounded" />

                                {/* Meta */}
                                <div className="flex items-center gap-3 pt-1">
                                    <div className="h-4 w-14 bg-muted/50 animate-pulse rounded" />
                                    <div className="h-4 w-14 bg-muted/50 animate-pulse rounded" />
                                </div>

                                {/* Tags */}
                                <div className="flex gap-1 pt-1">
                                    <div className="h-4 w-12 bg-muted/50 animate-pulse rounded-full" />
                                    <div className="h-4 w-16 bg-muted/50 animate-pulse rounded-full" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
