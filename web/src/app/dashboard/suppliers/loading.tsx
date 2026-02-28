import { Truck, Search } from "lucide-react";
import { PageLoader } from "@/components/PageLoader";

export default function SuppliersLoading() {
    return (
        <>
            <PageLoader />
            <div className="hidden md:block">
                <div className="h-screen flex flex-col bg-muted/10 overflow-hidden">
                    {/* Header */}
                    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shadow-sm shrink-0">
                        <div className="flex items-center gap-3">
                            <Truck className="h-5 w-5 text-primary" />
                            <div>
                                <h1 className="text-xl font-bold font-serif text-foreground">Fournisseurs</h1>
                                <p className="text-sm text-muted-foreground">Gérez vos fournisseurs et contacts.</p>
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
                                <div className="bg-muted/50 border-b border-border px-4 py-3 flex items-center gap-4">
                                    <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                                    <div className="h-4 w-1/4 bg-muted animate-pulse rounded" />
                                    <div className="h-4 w-1/5 bg-muted animate-pulse rounded" />
                                    <div className="h-4 w-1/5 bg-muted animate-pulse rounded" />
                                    <div className="h-4 w-1/6 bg-muted animate-pulse rounded" />
                                    <div className="ml-auto h-4 w-16 bg-muted animate-pulse rounded" />
                                </div>

                                {/* Rows */}
                                <div className="divide-y divide-border">
                                    {Array.from({ length: 7 }).map((_, i) => (
                                        <div key={i} className="px-4 py-3 flex items-center gap-4">
                                            {/* Checkbox */}
                                            <div className="h-4 w-4 bg-muted animate-pulse rounded shrink-0" />
                                            {/* Avatar + nom */}
                                            <div className="flex items-center gap-3 w-1/4">
                                                <div className="h-9 w-9 rounded-full bg-muted animate-pulse shrink-0" />
                                                <div className="h-4 w-3/4 bg-muted/70 animate-pulse rounded" />
                                            </div>
                                            {/* Contact */}
                                            <div className="w-1/5">
                                                <div className="h-4 w-2/3 bg-muted/60 animate-pulse rounded" />
                                            </div>
                                            {/* Email */}
                                            <div className="w-1/5">
                                                <div className="h-4 w-4/5 bg-muted/60 animate-pulse rounded" />
                                            </div>
                                            {/* Téléphone */}
                                            <div className="w-1/6">
                                                <div className="h-4 w-2/3 bg-muted/60 animate-pulse rounded" />
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
