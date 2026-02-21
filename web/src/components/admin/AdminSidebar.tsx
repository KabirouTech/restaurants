"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    Building2,
    Image,
    Megaphone,
    Settings,
    LogOut,
    ChevronLeft,
    ArrowLeft,
    Shield,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ModeToggle } from "@/components/mode-toggle";

const navItems = [
    { name: "Vue d'ensemble", href: "/admin", icon: LayoutDashboard },
    { name: "Organisations", href: "/admin/organizations", icon: Building2 },
    { name: "Bannières", href: "/admin/banners", icon: Image },
    { name: "Annonces", href: "/admin/announcements", icon: Megaphone },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

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
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                    return (
                        <Link key={item.href} href={item.href}>
                            <div
                                className={cn(
                                    "flex items-center rounded-lg text-sm font-medium transition-all mb-1 h-10 group/item relative",
                                    isActive
                                        ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                    collapsed ? "justify-center px-0" : "px-3 gap-3"
                                )}
                                title={collapsed ? item.name : undefined}
                            >
                                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground")} />
                                <span className={cn(
                                    "whitespace-nowrap transition-all duration-300",
                                    collapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                                )}>
                                    {item.name}
                                </span>

                                {/* Tooltip for collapsed state */}
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

                <form action="/auth/signout" method="post">
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
                </form>
            </div>
        </div>
    );
}
