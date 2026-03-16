"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    LayoutDashboard,
    Building2,
    Users,
    Image,
    Play,
    Megaphone,
    CreditCard,
    Crown,
    MessageSquareWarning,
    LogOut,
    ChevronLeft,
    ArrowLeft,
    Grid3x3,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ModeToggle } from "@/components/mode-toggle";
import { SignOutButton } from "@clerk/nextjs";

/* ── Navigation items ─────────────────────────────────────────────── */

const primaryTabs = [
    { name: "Accueil",  shortLabel: "Accueil", href: "/admin",               icon: LayoutDashboard },
    { name: "Orgs",     shortLabel: "Orgs",    href: "/admin/organizations", icon: Building2 },
    { name: "Users",    shortLabel: "Users",   href: "/admin/users",         icon: Users },
    { name: "Paiements",shortLabel: "Paie.",   href: "/admin/payments",      icon: CreditCard },
];

const secondaryItems = [
    { name: "Abonnements", shortLabel: "Abos",     href: "/admin/subscriptions",  icon: Crown },
    { name: "Bannières",   shortLabel: "Bannières", href: "/admin/banners",        icon: Image },
    { name: "Tutoriels",   shortLabel: "Tutoriels", href: "/admin/tutorials",      icon: Play },
    { name: "Annonces",    shortLabel: "Annonces",  href: "/admin/announcements",  icon: Megaphone },
    { name: "Plaintes",    shortLabel: "Plaintes",  href: "/admin/complaints",     icon: MessageSquareWarning },
];

const allNavItems = [...primaryTabs, ...secondaryItems];

/* ── Component ────────────────────────────────────────────────────── */

export function AdminSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);

    const isActive = (href: string) =>
        href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(href);

    const isMoreActive = secondaryItems.some((item) => isActive(item.href));

    return (
        <>
            {/* ══════════════════════════════════════════════════
                MOBILE: Bottom tab bar + "Plus" sheet
               ══════════════════════════════════════════════════ */}
            <nav className="fixed bottom-0 left-0 right-0 h-16 z-50 md:hidden bg-card/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)] flex items-center justify-around px-1">
                {primaryTabs.map((tab) => {
                    const active = isActive(tab.href);
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 min-w-0"
                        >
                            <Icon
                                className={cn(
                                    "h-5 w-5 transition-colors",
                                    active ? "text-orange-500" : "text-muted-foreground"
                                )}
                            />
                            <span
                                className={cn(
                                    "text-[10px] font-medium transition-colors",
                                    active ? "text-orange-500 font-semibold" : "text-muted-foreground"
                                )}
                            >
                                {tab.shortLabel}
                            </span>
                            {active && (
                                <span className="h-1 w-1 bg-orange-500 rounded-full" />
                            )}
                        </Link>
                    );
                })}

                {/* More tab */}
                <button
                    onClick={() => setMoreOpen(true)}
                    className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 min-w-0"
                >
                    <Grid3x3
                        className={cn(
                            "h-5 w-5 transition-colors",
                            isMoreActive ? "text-orange-500" : "text-muted-foreground"
                        )}
                    />
                    <span
                        className={cn(
                            "text-[10px] font-medium transition-colors",
                            isMoreActive ? "text-orange-500 font-semibold" : "text-muted-foreground"
                        )}
                    >
                        Plus
                    </span>
                    {isMoreActive && (
                        <span className="h-1 w-1 bg-orange-500 rounded-full" />
                    )}
                </button>
            </nav>

            {/* "Plus" bottom sheet */}
            <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetContent
                    side="bottom"
                    className="h-auto rounded-t-2xl px-4 pb-8 pt-4 md:hidden"
                >
                    <SheetTitle className="sr-only">Plus</SheetTitle>
                    <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

                    <div className="grid grid-cols-4 gap-3 mb-6">
                        {secondaryItems.map((item) => {
                            const active = isActive(item.href);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMoreOpen(false)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-3 rounded-xl transition-colors",
                                        active ? "bg-orange-500/10" : "hover:bg-muted"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center",
                                            active ? "bg-orange-500/20" : "bg-muted"
                                        )}
                                    >
                                        <Icon
                                            className={cn(
                                                "h-5 w-5",
                                                active ? "text-orange-500" : "text-muted-foreground"
                                            )}
                                        />
                                    </div>
                                    <span
                                        className={cn(
                                            "text-[11px] text-center font-medium leading-tight",
                                            active ? "text-orange-500" : "text-muted-foreground"
                                        )}
                                    >
                                        {item.shortLabel}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>

                    <Link
                        href="/dashboard"
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-muted-foreground mb-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="text-sm font-medium">Retour au Dashboard</span>
                    </Link>

                    <div className="border-t border-border pt-4 flex items-center justify-between gap-3">
                        <SignOutButton redirectUrl="/">
                            <button className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full flex-1">
                                <LogOut className="h-4 w-4 shrink-0" />
                                <span className="text-sm font-medium">Déconnexion</span>
                            </button>
                        </SignOutButton>
                        <ModeToggle />
                    </div>
                </SheetContent>
            </Sheet>

            {/* ══════════════════════════════════════════════════
                DESKTOP: Collapsible sidebar (unchanged)
               ══════════════════════════════════════════════════ */}
            <div
                className={cn(
                    "hidden md:flex flex-col h-full bg-card border-r border-border shrink-0 z-50 transition-all duration-300 ease-in-out relative group print:hidden",
                    collapsed ? "w-[70px]" : "w-64"
                )}
            >
                {/* Toggle Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "absolute -right-3 top-6 h-6 w-6 rounded-full border border-border bg-card shadow-md z-50 text-muted-foreground hover:text-foreground hidden group-hover:flex items-center justify-center",
                        collapsed && "flex"
                    )}
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <ChevronLeft className={cn("h-3 w-3 transition-transform", collapsed && "rotate-180")} />
                </Button>

                {/* Logo + Admin Badge */}
                <div className={cn(
                    "border-b border-border flex items-center h-[4.5rem] overflow-hidden whitespace-nowrap",
                    collapsed ? "justify-center px-0" : "px-6"
                )}>
                    {collapsed ? (
                        <div className="relative">
                            <Logo size="sm" showText={false} href="/admin" />
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-orange-500 border border-card" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Logo size="sm" showText href="/admin" className="text-secondary dark:text-foreground" />
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-500 text-white rounded">
                                Admin
                            </span>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
                    {allNavItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link key={item.href} href={item.href}>
                                <div
                                    className={cn(
                                        "flex items-center rounded-lg text-sm font-medium transition-all mb-1 h-10 group/item relative",
                                        active
                                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                        collapsed ? "justify-center px-0" : "px-3 gap-3"
                                    )}
                                    title={collapsed ? item.name : undefined}
                                >
                                    <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground")} />
                                    <span className={cn(
                                        "whitespace-nowrap transition-all duration-300",
                                        collapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                                    )}>
                                        {item.name}
                                    </span>

                                    {collapsed && (
                                        <div className="absolute left-full ml-2 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded opacity-0 group-hover/item:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-md">
                                            {item.name}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="p-3 border-t border-border space-y-1 overflow-hidden">
                    <Link href="/dashboard">
                        <div className={cn(
                            "flex items-center rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground h-10",
                            collapsed ? "justify-center px-0" : "px-3 gap-3"
                        )} title={collapsed ? "Retour au Dashboard" : undefined}>
                            <ArrowLeft className="h-4 w-4 shrink-0" />
                            <span className={cn(
                                "whitespace-nowrap transition-all duration-300",
                                collapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                            )}>
                                Retour au Dashboard
                            </span>
                        </div>
                    </Link>

                    <div className={cn(
                        "flex items-center rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground h-10 cursor-pointer",
                        collapsed ? "justify-center px-0" : "px-3 gap-3"
                    )} title={collapsed ? "Apparence" : undefined}>
                        <div className="flex items-center w-full" onClick={(e) => e.stopPropagation()}>
                            <div className={cn("flex items-center w-full", collapsed ? "justify-center" : "gap-3")}>
                                <ModeToggle />
                                <span className={cn(
                                    "whitespace-nowrap transition-all duration-300",
                                    "opacity-100"
                                )}>
                                    {!collapsed && "Apparence"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <SignOutButton redirectUrl="/">
                        <button className={cn(
                            "flex items-center rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors h-10 w-full",
                            collapsed ? "justify-center px-0" : "px-3 gap-3"
                        )} title={collapsed ? "Déconnexion" : undefined}>
                            <LogOut className="h-4 w-4 shrink-0" />
                            <span className={cn(
                                "whitespace-nowrap transition-all duration-300",
                                collapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                            )}>
                                Déconnexion
                            </span>
                        </button>
                    </SignOutButton>
                </div>
            </div>
        </>
    );
}
