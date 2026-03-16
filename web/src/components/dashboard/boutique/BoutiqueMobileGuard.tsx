"use client";

import { Monitor, Palette } from "lucide-react";

export function BoutiqueMobileGuard({ children }: { children: React.ReactNode }) {
    return (
        <>
            {/* Mobile: show message */}
            <div className="md:hidden min-h-[80vh] flex items-center justify-center px-6">
                <div className="text-center max-w-sm space-y-6">
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <Monitor className="h-10 w-10 text-white" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-foreground">
                            Ecran plus grand recommandé
                        </h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            L&apos;éditeur de boutique nécessite un écran plus grand pour une meilleure expérience.
                            Utilisez un ordinateur ou une tablette pour personnaliser votre vitrine.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                        <Palette className="h-5 w-5 text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-700 dark:text-amber-400 text-left">
                            Vous pourrez choisir un template, modifier les couleurs, ajouter vos photos et configurer chaque section de votre site.
                        </p>
                    </div>
                </div>
            </div>

            {/* Desktop: show editor */}
            <div className="hidden md:block">
                {children}
            </div>
        </>
    );
}
