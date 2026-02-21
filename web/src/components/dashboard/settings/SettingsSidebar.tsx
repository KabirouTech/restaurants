"use client";

import { useState } from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, Globe, Utensils, CalendarDays, Kanban, MessageCircle, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SettingsSidebar() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className={cn(
            "relative shrink-0 transition-all duration-300 ease-in-out md:sticky md:top-[160px] z-10 group",
            collapsed ? "w-full md:w-[60px]" : "w-full md:w-64"
        )}>
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    "absolute -right-3 top-2 h-6 w-6 rounded-full border border-border bg-card shadow-md z-20 text-muted-foreground hover:text-foreground hidden md:flex items-center justify-center transition-transform",
                    collapsed && "rotate-180"
                )}
                onClick={() => setCollapsed(!collapsed)}
            >
                <ChevronLeft className="h-3 w-3" />
            </Button>

            <TabsList className="flex flex-row md:flex-col justify-start items-stretch h-auto bg-transparent p-0 gap-1 w-full overflow-x-auto md:overflow-visible no-scrollbar">

                {/* Entreprise */}
                <h3 className={cn("text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4 hidden md:block px-3 transition-all duration-300", collapsed ? "opacity-0 h-0 overflow-hidden mb-0 mt-2" : "opacity-100")}>
                    Entreprise
                </h3>
                {collapsed && <div className="hidden md:block h-2" />}

                <TabsTrigger value="general" className={cn("w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors rounded-lg", collapsed && "md:justify-center md:px-0")} title={collapsed ? "Boutique & Contact" : undefined}>
                    <Store className="h-4 w-4 shrink-0" />
                    <span className={cn("transition-opacity whitespace-nowrap", collapsed && "md:hidden")}>Boutique & Contact</span>
                </TabsTrigger>

                {/* Site Public */}
                <h3 className={cn("text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-6 hidden md:block px-3 transition-opacity", collapsed ? "opacity-0 h-0 overflow-hidden mb-0 mt-2" : "opacity-100")}>
                    Site Public
                </h3>
                {collapsed && <div className="hidden md:block h-6" />}

                <TabsTrigger value="site" className={cn("w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors rounded-lg", collapsed && "md:justify-center md:px-0")} title={collapsed ? "Éditeur Vitrine" : undefined}>
                    <Globe className="h-4 w-4 shrink-0" />
                    <span className={cn("transition-opacity whitespace-nowrap", collapsed && "md:hidden")}>Éditeur Vitrine</span>
                </TabsTrigger>

                <TabsTrigger value="menu" className={cn("w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors rounded-lg", collapsed && "md:justify-center md:px-0")} title={collapsed ? "Carte & Allergènes" : undefined}>
                    <Utensils className="h-4 w-4 shrink-0" />
                    <span className={cn("transition-opacity whitespace-nowrap", collapsed && "md:hidden")}>Carte & Allergènes</span>
                </TabsTrigger>

                {/* Opérations */}
                <h3 className={cn("text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-6 hidden md:block px-3 transition-opacity", collapsed ? "opacity-0 h-0 overflow-hidden mb-0 mt-2" : "opacity-100")}>
                    Opérations
                </h3>
                {collapsed && <div className="hidden md:block h-6" />}

                <TabsTrigger value="capacity" className={cn("w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors rounded-lg", collapsed && "md:justify-center md:px-0")} title={collapsed ? "Prestations" : undefined}>
                    <CalendarDays className="h-4 w-4 shrink-0" />
                    <span className={cn("transition-opacity whitespace-nowrap", collapsed && "md:hidden")}>Prestations</span>
                </TabsTrigger>

                <TabsTrigger value="kanban" className={cn("w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors rounded-lg", collapsed && "md:justify-center md:px-0")} title={collapsed ? "Flux (Kanban)" : undefined}>
                    <Kanban className="h-4 w-4 shrink-0" />
                    <span className={cn("transition-opacity whitespace-nowrap", collapsed && "md:hidden")}>Flux (Kanban)</span>
                </TabsTrigger>

                {/* Intégrations */}
                <h3 className={cn("text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-6 hidden md:block px-3 transition-opacity", collapsed ? "opacity-0 h-0 overflow-hidden mb-0 mt-2" : "opacity-100")}>
                    Intégrations
                </h3>
                {collapsed && <div className="hidden md:block h-6" />}

                <TabsTrigger value="channels" className={cn("w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none hover:bg-muted/50 transition-colors rounded-lg", collapsed && "md:justify-center md:px-0")} title={collapsed ? "Canaux Messagerie" : undefined}>
                    <MessageCircle className="h-4 w-4 shrink-0" />
                    <span className={cn("transition-opacity whitespace-nowrap", collapsed && "md:hidden")}>Canaux Messagerie</span>
                </TabsTrigger>
            </TabsList>
        </div>
    );
}
