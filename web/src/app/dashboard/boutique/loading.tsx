import { Palette } from "lucide-react";
import { PageLoader } from "@/components/PageLoader";

export default function BoutiqueLoading() {
    return (
        <>
            <PageLoader />
            <div className="hidden md:block">
                <div className="min-h-screen animate-in fade-in duration-500 pb-24">
                    {/* Header skeleton aligned with boutique page */}
                    <div className="sticky top-0 z-40 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-border shadow-sm p-4 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[1600px] mx-auto w-full">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-primary font-medium mb-1">
                                    <Palette className="h-5 w-5" />
                                    <span>Boutique</span>
                                </div>
                                <div className="h-8 w-80 bg-muted animate-pulse rounded" />
                                <div className="h-4 w-[30rem] bg-muted/60 animate-pulse rounded" />
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="h-10 w-40 rounded-md border border-border bg-muted/40 animate-pulse" />
                                <div className="h-10 w-36 rounded-md border border-border bg-primary/20 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Body skeleton aligned with SiteSettings layout */}
                    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
                        <div className="flex flex-col xl:flex-row gap-8 items-start relative pb-12">
                            {/* Left editor column */}
                            <div className="w-full xl:w-1/2 space-y-5">
                                <div className="border border-border rounded-xl bg-card p-6 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-lg bg-primary/15 animate-pulse" />
                                            <div className="space-y-2">
                                                <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                                                <div className="h-3 w-60 bg-muted/60 animate-pulse rounded" />
                                            </div>
                                        </div>
                                        <div className="h-6 w-24 bg-muted/70 animate-pulse rounded-full" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="rounded-xl border border-border p-3 space-y-3">
                                                <div className="h-24 rounded-lg bg-muted/60 animate-pulse" />
                                                <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                                                <div className="h-3 w-full bg-muted/60 animate-pulse rounded" />
                                                <div className="h-8 w-full bg-muted/50 animate-pulse rounded-md" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="border border-border rounded-xl bg-card p-6 shadow-sm space-y-4">
                                        <div className="flex items-center gap-3 pb-3 border-b border-border">
                                            <div className="h-9 w-9 rounded-lg bg-primary/10 animate-pulse" />
                                            <div className="space-y-2">
                                                <div className="h-4 w-44 bg-muted animate-pulse rounded" />
                                                <div className="h-3 w-64 bg-muted/60 animate-pulse rounded" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                                                <div className="h-10 w-full bg-muted/50 animate-pulse rounded-md" />
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                                                <div className="h-10 w-full bg-muted/50 animate-pulse rounded-md" />
                                            </div>
                                        </div>
                                        <div className="h-24 w-full bg-muted/40 animate-pulse rounded-md" />
                                    </div>
                                ))}
                            </div>

                            {/* Right preview column */}
                            <div className="hidden xl:flex w-full xl:w-1/2 sticky top-[160px] h-[calc(100vh-190px)] items-center justify-center z-40">
                                <div className="relative w-full max-w-[1000px]">
                                    <div className="relative bg-zinc-900 p-3 rounded-2xl shadow-2xl border border-zinc-700">
                                        <div className="relative aspect-[16/10] w-full bg-background rounded-md overflow-hidden ring-1 ring-white/10">
                                            <div className="h-6 bg-muted border-b flex items-center px-3 gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div className="h-12 rounded-xl bg-muted/70 animate-pulse" />
                                                <div className="h-56 rounded-2xl bg-muted/60 animate-pulse" />
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="h-28 rounded-xl bg-muted/50 animate-pulse" />
                                                    <div className="h-28 rounded-xl bg-muted/50 animate-pulse" />
                                                    <div className="h-28 rounded-xl bg-muted/50 animate-pulse" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-6 flex items-center justify-center">
                                            <div className="w-1 h-1 rounded-full bg-zinc-800 animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
