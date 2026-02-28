import { Loader2 } from "lucide-react";

/**
 * Mobile-only centered spinner shown during page loading (Next.js loading.tsx).
 * On desktop (md+), renders nothing — the skeleton takes over via `hidden md:block`.
 */
export function PageLoader() {
    return (
        <div className="md:hidden flex flex-col items-center justify-center h-[calc(100dvh-7rem)] gap-4">
            <div className="relative">
                <div className="absolute -inset-8 bg-primary/10 rounded-full blur-2xl" />
                <div className="relative w-14 h-14 rounded-2xl bg-card/70 backdrop-blur-sm border border-border/40 shadow-lg flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            </div>
            <p className="text-xs text-muted-foreground/70 font-medium tracking-wide">Chargement…</p>
        </div>
    );
}
