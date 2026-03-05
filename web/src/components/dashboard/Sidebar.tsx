"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useFCM } from "@/hooks/useFCM";
import {
    LayoutDashboard,
    CalendarDays,
    FileText,
    Utensils,
    MessageSquare,
    Users,
    Package,
    Truck,
    BookOpen,
    MessageSquareWarning,
    Settings,
    LogOut,
    ChevronLeft,
    Bell,
    Shield,
    Lock,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";
import type { PlanKey } from "@/lib/plans/plan-limits";

type RequiredPlan = "premium" | "enterprise";

function isLocked(requiresPlan: RequiredPlan | undefined, currentPlan: PlanKey): boolean {
    if (!requiresPlan) return false;
    if (requiresPlan === "premium") return currentPlan === "free";
    if (requiresPlan === "enterprise") return currentPlan === "free" || currentPlan === "premium";
    return false;
}

export function Sidebar({ isSuperAdmin, plan = "free" }: { isSuperAdmin?: boolean; plan?: PlanKey }) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const { requestPermission, permissionStatus } = useFCM();
    const t = useTranslations("dashboard.sidebar");

    const navItems: {
        name: string;
        href: string;
        icon: React.ElementType;
        requiresPlan?: RequiredPlan;
    }[] = [
        { name: t("home"), href: "/dashboard", icon: LayoutDashboard },
        { name: t("orders"), href: "/dashboard/orders", icon: FileText },
        { name: t("calendar"), href: "/dashboard/calendar", icon: CalendarDays },
        { name: t("menu"), href: "/dashboard/menu", icon: Utensils },
        { name: t("messages"), href: "/dashboard/inbox", icon: MessageSquare, requiresPlan: "premium" },
        { name: t("customers"), href: "/dashboard/customers", icon: Users },
        { name: t("inventory"), href: "/dashboard/inventory", icon: Package },
        { name: t("suppliers"), href: "/dashboard/suppliers", icon: Truck },
        { name: t("recipes"), href: "/dashboard/recipes", icon: BookOpen },
        { name: t("support"), href: "/dashboard/support", icon: MessageSquareWarning },
    ];

    return (
        <div
            className={cn(
                "flex flex-col h-full bg-card border-r border-border shrink-0 z-50 transition-all duration-300 ease-in-out relative group print:hidden",
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

            {/* Logo */}
            <div className={cn(
                "border-b border-border flex items-center h-[4.5rem] overflow-hidden whitespace-nowrap",
                collapsed ? "justify-center px-0" : "px-6"
            )}>
                {collapsed ? (
                    <Logo size="sm" showText={false} href="/dashboard" />
                ) : (
                    <Logo size="sm" showText href="/dashboard" className="text-secondary dark:text-foreground" />
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    const locked = isLocked(item.requiresPlan, plan);

                    return (
                        <Link key={item.href} href={item.href}>
                            <div
                                className={cn(
                                    "flex items-center rounded-lg text-sm font-medium transition-all mb-1 h-10 group/item relative",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : locked
                                            ? "text-muted-foreground/60 hover:bg-muted/60 hover:text-muted-foreground"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                    collapsed ? "justify-center px-0" : "px-3 gap-3"
                                )}
                                title={collapsed ? item.name : undefined}
                            >
                                <item.icon className={cn(
                                    "h-4 w-4 shrink-0",
                                    isActive ? "text-primary" : locked ? "text-muted-foreground/50" : "text-muted-foreground"
                                )} />

                                {!collapsed && (
                                    <span className="whitespace-nowrap flex-1 transition-all duration-300 opacity-100">
                                        {item.name}
                                    </span>
                                )}

                                {/* PRO badge (expanded) or lock icon (collapsed) */}
                                {locked && !collapsed && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wide border border-amber-200 dark:border-amber-800 flex-shrink-0">
                                        <Lock className="h-2.5 w-2.5" />
                                        Pro
                                    </span>
                                )}
                                {locked && collapsed && (
                                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 border border-background flex items-center justify-center">
                                        <Lock className="h-2 w-2 text-white" />
                                    </div>
                                )}

                                {/* Tooltip for collapsed state */}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded opacity-0 group-hover/item:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-md">
                                        {item.name}
                                        {locked && " 🔒"}
                                    </div>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-border space-y-1 overflow-hidden">
                {/* Notification Request Button */}
                {permissionStatus === "default" && (
                    <button
                        onClick={requestPermission}
                        className={cn(
                            "flex items-center rounded-lg text-sm font-medium transition-colors text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 h-10 w-full mb-2",
                            collapsed ? "justify-center px-0" : "px-3 gap-3"
                        )}
                        title={t("notifications")}
                    >
                        <Bell className="h-4 w-4 shrink-0 animate-pulse" />
                        <span className={cn(
                            "whitespace-nowrap transition-all duration-300",
                            collapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                        )}>
                            {t("notifications")}
                        </span>
                    </button>
                )}

                {isSuperAdmin && (
                    <Link href="/admin">
                        <div className={cn(
                            "flex items-center rounded-lg text-sm font-medium transition-colors text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 h-10 group/item relative",
                            collapsed ? "justify-center px-0" : "px-3 gap-3"
                        )} title={collapsed ? t("superAdmin") : undefined}>
                            <Shield className="h-4 w-4 shrink-0" />
                            <span className={cn(
                                "whitespace-nowrap transition-all duration-300",
                                collapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                            )}>
                                {t("superAdmin")}
                            </span>
                            {collapsed && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded opacity-0 group-hover/item:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-md">
                                    {t("superAdmin")}
                                </div>
                            )}
                        </div>
                    </Link>
                )}

                <Link href="/dashboard/settings">
                    <div className={cn(
                        "flex items-center rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground h-10",
                        pathname === "/dashboard/settings" && "bg-muted text-foreground",
                        collapsed ? "justify-center px-0" : "px-3 gap-3"
                    )} title={collapsed ? t("settings") : undefined}>
                        <Settings className="h-4 w-4 shrink-0" />
                        <span className={cn(
                            "whitespace-nowrap transition-all duration-300",
                            collapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                        )}>
                            {t("settings")}
                        </span>
                    </div>
                </Link>

                <div className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground h-10 cursor-pointer",
                    collapsed ? "justify-center px-0" : "px-3 gap-3"
                )} title={collapsed ? t("appearance") : undefined}>
                    <div className="flex items-center w-full" onClick={(e) => e.stopPropagation()}>
                        <div className={cn("flex items-center w-full", collapsed ? "justify-center" : "gap-3")}>
                            <ModeToggle />
                            {!collapsed && <span className="whitespace-nowrap">{t("appearance")}</span>}
                        </div>
                    </div>
                </div>

                {/* Language Switcher */}
                <div className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-colors text-muted-foreground h-10",
                    collapsed ? "justify-center px-0" : "px-3 gap-3"
                )}>
                    <LanguageSwitcher />
                    {!collapsed && <span className="whitespace-nowrap">{t("language")}</span>}
                </div>

                <form action="/auth/signout" method="post">
                    <button className={cn(
                        "flex items-center rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors h-10 w-full",
                        collapsed ? "justify-center px-0" : "px-3 gap-3"
                    )} title={collapsed ? t("logout") : undefined}>
                        <LogOut className="h-4 w-4 shrink-0" />
                        <span className={cn(
                            "whitespace-nowrap transition-all duration-300",
                            collapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                        )}>
                            {t("logout")}
                        </span>
                    </button>
                </form>
            </div>
        </div>
    );
}
