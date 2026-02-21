import { Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CustomersLoading() {
    return (
        <div className="h-screen flex flex-col bg-muted/10 animate-in fade-in duration-500 overflow-hidden">
            {/* Header Skeleton */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h1 className="text-xl font-bold font-serif text-foreground">Clients</h1>
                </div>
            </header>

            <main className="flex-1 overflow-auto p-6">
                <div className="space-y-4">
                    {/* Toolbar Skeleton */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                            <div className="h-10 w-full bg-card border border-border rounded-md animate-pulse" />
                        </div>
                        <div className="h-10 w-32 bg-primary/20 rounded-md animate-pulse" />
                    </div>

                    {/* Table Skeleton */}
                    <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
                        <div className="bg-muted/50 border-b border-border p-4 flex gap-4">
                            <div className="h-5 w-1/4 bg-muted animate-pulse rounded" />
                            <div className="h-5 w-1/4 bg-muted animate-pulse rounded" />
                            <div className="h-5 w-1/4 bg-muted animate-pulse rounded" />
                            <div className="h-5 w-1/4 bg-muted animate-pulse rounded" />
                        </div>
                        <div className="divide-y divide-border">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="p-4 flex gap-4 items-center">
                                    <div className="flex items-center gap-3 w-1/4">
                                        <div className="h-10 w-10 rounded-full bg-muted animate-pulse shrink-0" />
                                        <div className="h-5 w-1/2 bg-muted/60 animate-pulse rounded" />
                                    </div>
                                    <div className="w-1/4">
                                        <div className="h-5 w-2/3 bg-muted/60 animate-pulse rounded" />
                                    </div>
                                    <div className="w-1/4">
                                        <div className="h-5 w-1/2 bg-muted/60 animate-pulse rounded" />
                                    </div>
                                    <div className="w-1/4 flex justify-end gap-2">
                                        <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                                        <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
