import { Package, Search } from "lucide-react";
import { PageLoader } from "@/components/PageLoader";

export default function InventoryLoading() {
    return (
        <>
            <PageLoader />
            <div className="hidden md:block">
                <div className="h-screen flex flex-col bg-muted/10 overflow-hidden">
                    {/* Header */}
                    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shadow-sm shrink-0">
                        <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-primary" />
                            <div>
                                <h1 className="text-xl font-bold font-serif text-foreground">Inventaire</h1>
                                <p className="text-sm text-muted-foreground">Suivez vos stocks et ingrédients.</p>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-auto p-6">
                        <div className="space-y-4">
                            {/* Toolbar */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                                <div className="flex gap-2 flex-1">
                                    <div className="relative flex-1 max-w-sm">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                                        <div className="h-10 w-full bg-card border border-border rounded-md animate-pulse" />
                                    </div>
                                    {/* View toggle */}
                                    <div className="h-10 w-20 bg-card border border-border rounded-md animate-pulse" />
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-10 w-28 bg-card border border-border rounded-md animate-pulse" />
                                    <div className="h-10 w-36 bg-primary/20 rounded-md animate-pulse" />
                                </div>
                            </div>

                            {/* Table */}
                            <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
                                {/* Header */}
                                <div className="bg-muted/50 border-b border-border px-4 py-3 flex items-center gap-3">
                                    <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                                    <div className="h-4 flex-1 max-w-[180px] bg-muted animate-pulse rounded" />
                                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                    <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                                    <div className="ml-auto h-4 w-16 bg-muted animate-pulse rounded" />
                                </div>

                                {/* Rows */}
                                <div className="divide-y divide-border">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="px-4 py-3 flex items-center gap-3">
                                            {/* Checkbox */}
                                            <div className="h-4 w-4 bg-muted animate-pulse rounded shrink-0" />
                                            {/* Nom */}
                                            <div className="flex-1 max-w-[180px]">
                                                <div className="h-4 w-4/5 bg-muted/70 animate-pulse rounded" />
                                            </div>
                                            {/* Catégorie */}
                                            <div className="w-24">
                                                <div className="h-5 w-full bg-muted/50 animate-pulse rounded-full" />
                                            </div>
                                            {/* Unité */}
                                            <div className="w-16">
                                                <div className="h-4 w-10 bg-muted/60 animate-pulse rounded" />
                                            </div>
                                            {/* Stock */}
                                            <div className="w-20">
                                                {i % 4 === 0 ? (
                                                    <div className="h-5 w-16 bg-red-200/60 animate-pulse rounded" />
                                                ) : (
                                                    <div className="h-4 w-12 bg-muted/60 animate-pulse rounded" />
                                                )}
                                            </div>
                                            {/* Seuil */}
                                            <div className="w-20">
                                                <div className="h-4 w-10 bg-muted/60 animate-pulse rounded" />
                                            </div>
                                            {/* Coût */}
                                            <div className="w-24">
                                                <div className="h-4 w-16 bg-muted/60 animate-pulse rounded" />
                                            </div>
                                            {/* Fournisseur */}
                                            <div className="w-28">
                                                <div className="h-4 w-4/5 bg-muted/60 animate-pulse rounded" />
                                            </div>
                                            {/* Actions */}
                                            <div className="ml-auto flex gap-2">
                                                <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
