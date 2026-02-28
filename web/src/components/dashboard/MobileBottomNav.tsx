"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    FileText,
    CalendarDays,
    MessageSquare,
    Grid3x3,
    Users,
    Package,
    Truck,
    BookOpen,
    Utensils,
    Settings,
    LogOut,
    Lock,
    Shield,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { PlanKey } from "@/lib/plans/plan-limits";

type RequiredPlan = "premium" | "enterprise";

function isLocked(requiresPlan: RequiredPlan | undefined, currentPlan: PlanKey): boolean {
    if (!requiresPlan) return false;
    if (requiresPlan === "premium") return currentPlan === "free";
    if (requiresPlan === "enterprise") return currentPlan === "free" || currentPlan === "premium";
    return false;
}

interface MobileBottomNavProps {
    plan: PlanKey;
    isSuperAdmin?: boolean;
}

interface PrimaryTab {
    id: string;
    href: string;
    icon: React.ElementType;
    labelKey: string;
    shortLabel: string;
    requiresPlan?: RequiredPlan;
}

const primaryTabs: PrimaryTab[] = [
    { id: "home",     href: "/dashboard",          icon: LayoutDashboard, labelKey: "home",     shortLabel: "Accueil" },
    { id: "orders",   href: "/dashboard/orders",   icon: FileText,        labelKey: "orders",   shortLabel: "Devis" },
    { id: "calendar", href: "/dashboard/calendar", icon: CalendarDays,    labelKey: "calendar", shortLabel: "Agenda" },
    { id: "inbox",    href: "/dashboard/inbox",    icon: MessageSquare,   labelKey: "messages", shortLabel: "Chat", requiresPlan: "premium" },
];

interface SecondaryItem {
    href: string;
    icon: React.ElementType;
    labelKey: string;
    shortLabel: string;
}

const secondaryItems: SecondaryItem[] = [
    { href: "/dashboard/customers", icon: Users,    labelKey: "customers", shortLabel: "Clients" },
    { href: "/dashboard/inventory", icon: Package,  labelKey: "inventory", shortLabel: "Stock" },
    { href: "/dashboard/suppliers", icon: Truck,    labelKey: "suppliers", shortLabel: "Fourn." },
    { href: "/dashboard/recipes",   icon: BookOpen, labelKey: "recipes",   shortLabel: "Recettes" },
    { href: "/dashboard/menu",      icon: Utensils, labelKey: "menu",      shortLabel: "Menu" },
    { href: "/dashboard/settings",  icon: Settings, labelKey: "settings",  shortLabel: "Config" },
];

export function MobileBottomNav({ plan, isSuperAdmin }: MobileBottomNavProps) {
    const [moreOpen, setMoreOpen] = useState(false);
    const pathname = usePathname();
    const t = useTranslations("dashboard.sidebar");

    const isTabActive = (href: string) =>
        href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);

    const isMoreActive = secondaryItems.some((item) => pathname.startsWith(item.href));

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 h-16 z-50 md:hidden bg-card/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)] flex items-center justify-around px-2">
                {primaryTabs.map((tab) => {
                    const active = isTabActive(tab.href);
                    const locked = isLocked(tab.requiresPlan, plan);
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 min-w-0"
                            aria-label={tab.shortLabel}
                        >
                            <div className="relative">
                                <Icon
                                    className={cn(
                                        "h-5 w-5 transition-colors",
                                        active ? "text-primary" : "text-muted-foreground"
                                    )}
                                />
                                {locked && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full flex items-center justify-center">
                                        <Lock className="h-1.5 w-1.5 text-white" />
                                    </span>
                                )}
                            </div>
                            <span
                                className={cn(
                                    "text-[10px] font-medium transition-colors",
                                    active ? "text-primary font-semibold" : "text-muted-foreground"
                                )}
                            >
                                {tab.shortLabel}
                            </span>
                            {active && (
                                <span className="h-1 w-1 bg-primary rounded-full mt-0.5" />
                            )}
                        </Link>
                    );
                })}

                {/* More tab */}
                <button
                    onClick={() => setMoreOpen(true)}
                    className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 min-w-0"
                    aria-label="Plus"
                >
                    <Grid3x3
                        className={cn(
                            "h-5 w-5 transition-colors",
                            isMoreActive ? "text-primary" : "text-muted-foreground"
                        )}
                    />
                    <span
                        className={cn(
                            "text-[10px] font-medium transition-colors",
                            isMoreActive ? "text-primary font-semibold" : "text-muted-foreground"
                        )}
                    >
                        Plus
                    </span>
                    {isMoreActive && (
                        <span className="h-1 w-1 bg-primary rounded-full mt-0.5" />
                    )}
                </button>
            </nav>

            {/* "More" Sheet */}
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetContent
                    side="bottom"
                    className="h-auto rounded-t-2xl px-4 pb-8 pt-4 md:hidden"
                >
                    <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {secondaryItems.map((item) => {
                            const active = pathname.startsWith(item.href);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMoreOpen(false)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-3 rounded-xl transition-colors",
                                        active ? "bg-primary/10" : "hover:bg-muted"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center",
                                            active ? "bg-primary/20" : "bg-muted"
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                "h-5 w-5",
                                                active ? "text-primary" : "text-muted-foreground"
                                            )}
                                        />
                                    </div>
                                    <span
                                        className={cn(
                                            "text-xs text-center font-medium",
                                            active ? "text-primary" : "text-muted-foreground"
                                        )}
                                    >
                                        {item.shortLabel}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>

                    {isSuperAdmin && (
                        <Link
                            href="/admin"
                            onClick={() => setMoreOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/30 text-orange-500 mb-2"
                        >
                            <Shield className="h-4 w-4" />
                            <span className="text-sm font-medium">{t("superAdmin")}</span>
                        </Link>
                    )}

                    <div className="border-t border-border pt-4 flex items-center justify-between gap-3">
                        <form action="/auth/signout" method="post" className="flex-1">
                            <button className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full">
                                <LogOut className="h-4 w-4 shrink-0" />
                                <span className="text-sm font-medium">{t("logout")}</span>
                            </button>
                        </form>
                        <div className="flex items-center gap-2 shrink-0">
                            <ModeToggle />
                            <LanguageSwitcher />
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
