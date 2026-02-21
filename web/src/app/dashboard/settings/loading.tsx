import { Store } from "lucide-react";

export default function SettingsLoading() {
    return (
        <div className="min-h-screen animate-in fade-in duration-500 pb-24">
            {/* Header — matches the real sticky header */}
            <div className="sticky top-0 z-40 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-border shadow-sm p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[1600px] mx-auto w-full">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-primary font-medium mb-1">
                            <Store className="h-5 w-5" />
                            <span>Configuration</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold font-serif text-foreground">
                            Paramètres de la Boutique
                        </h1>
                        <p className="text-muted-foreground text-sm md:text-base">
                            Gérez votre identité, votre site vitrine et vos opérations.
                        </p>
                    </div>
                </div>
            </div>

            {/* Body — sidebar + content skeleton */}
            <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
                <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* Vertical Sidebar Skeleton */}
                    <div className="shrink-0 w-full md:w-64 space-y-2">
                        {/* Section: Entreprise */}
                        <div className="h-3 w-20 bg-muted animate-pulse rounded mt-4 mb-3 mx-3 hidden md:block" />
                        <div className="h-10 w-full bg-muted/60 animate-pulse rounded-lg" />

                        {/* Section: Site Public */}
                        <div className="h-3 w-20 bg-muted animate-pulse rounded mt-6 mb-3 mx-3 hidden md:block" />
                        <div className="h-10 w-full bg-muted/60 animate-pulse rounded-lg" />
                        <div className="h-10 w-full bg-muted/40 animate-pulse rounded-lg" />

                        {/* Section: Opérations */}
                        <div className="h-3 w-24 bg-muted animate-pulse rounded mt-6 mb-3 mx-3 hidden md:block" />
                        <div className="h-10 w-full bg-muted/40 animate-pulse rounded-lg" />
                        <div className="h-10 w-full bg-muted/40 animate-pulse rounded-lg" />

                        {/* Section: Intégrations */}
                        <div className="h-3 w-24 bg-muted animate-pulse rounded mt-6 mb-3 mx-3 hidden md:block" />
                        <div className="h-10 w-full bg-muted/40 animate-pulse rounded-lg" />
                    </div>

                    {/* Content Skeleton */}
                    <div className="flex-1 w-full min-w-0 md:pl-2 space-y-4">
                        {/* Tab title */}
                        <div className="pb-4 space-y-2">
                            <div className="h-6 w-44 bg-muted animate-pulse rounded" />
                            <div className="h-4 w-72 bg-muted/50 animate-pulse rounded" />
                        </div>

                        {/* Card skeleton */}
                        <div className="border border-border rounded-xl bg-card p-6 shadow-sm space-y-6">
                            <div className="flex items-center gap-4 border-b border-border pb-6">
                                <div className="h-20 w-20 rounded-full bg-muted animate-pulse shrink-0" />
                                <div className="flex flex-col gap-2">
                                    <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                                    <div className="h-8 w-24 bg-primary/20 animate-pulse rounded-md" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                        <div className="h-10 w-full bg-muted/50 animate-pulse rounded-md border border-border" />
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                <div className="h-24 w-full bg-muted/50 animate-pulse rounded-md border border-border" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
