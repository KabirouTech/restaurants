"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    ChefHat,
    CalendarDays,
    FileText,
    Utensils,
    MessageSquare,
    Users,
    Settings,
    LogOut,
    PanelLeft,
    ChevronLeft
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

const navItems = [
    { name: "Tableau de Bord", href: "/dashboard", icon: LayoutDashboard },
    { name: "Devis & Commandes", href: "/dashboard/orders", icon: FileText },
    { name: "Calendrier", href: "/dashboard/calendar", icon: CalendarDays },
    { name: "Carte & Menu", href: "/dashboard/menu", icon: Utensils },
    { name: "Messages", href: "/dashboard/inbox", icon: MessageSquare },
    { name: "Clients", href: "/dashboard/customers", icon: Users },
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div
            className={cn(
                "flex flex-col h-full bg-white border-r border-border shrink-0 z-50 transition-all duration-300 ease-in-out relative group",
                collapsed ? "w-[70px]" : "w-64"
            )}
        >
            {/* Toggle Button (visible on hover or always?) -> Let's put it in header or floating */}
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    "absolute -right-3 top-6 h-6 w-6 rounded-full border border-border bg-white shadow-md z-50 text-muted-foreground hover:text-foreground hidden group-hover:flex items-center justify-center",
                    collapsed && "flex" // Always show when collapsed to allow opening
                )}
                onClick={() => setCollapsed(!collapsed)}
            >
                <ChevronLeft className={cn("h-3 w-3 transition-transform", collapsed && "rotate-180")} />
            </Button>

            {/* Logo */}
            <div className={cn(
                "border-b border-border flex items-center h-[4.5rem] overflow-hidden whitespace-nowrap",
                collapsed ? "justify-center px-0" : "px-6 gap-2"
            )}>
                <ChefHat className="h-6 w-6 text-primary shrink-0" />
                <span className={cn(
                    "font-serif font-bold text-lg text-secondary transition-opacity duration-300",
                    collapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                )}>
                    Restaurant OS
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                        <Link key={item.href} href={item.href}>
                            <div
                                className={cn(
                                    "flex items-center rounded-lg text-sm font-medium transition-all mb-1 h-10 group/item relative",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                    collapsed ? "justify-center px-0" : "px-3 gap-3"
                                )}
                                title={collapsed ? item.name : undefined}
                            >
                                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                                <span className={cn(
                                    "whitespace-nowrap transition-all duration-300",
                                    collapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                                )}>
                                    {item.name}
                                </span>

                                {/* Tooltip for collapsed state */}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-secondary text-white text-xs rounded opacity-0 group-hover/item:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-md">
                                        {item.name}
                                    </div>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-border space-y-1 overflow-hidden">
                <Link href="/dashboard/settings">
                    <div className={cn(
                        "flex items-center rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground h-10",
                        pathname === "/dashboard/settings" && "bg-muted text-foreground",
                        collapsed ? "justify-center px-0" : "px-3 gap-3"
                    )} title={collapsed ? "Paramètres" : undefined}>
                        <Settings className="h-4 w-4 shrink-0" />
                        <span className={cn(
                            "whitespace-nowrap transition-all duration-300",
                            collapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                        )}>
                            Paramètres
                        </span>
                    </div>
                </Link>

                <div className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground h-10 cursor-pointer",
                    collapsed ? "justify-center px-0" : "px-3 gap-3"
                )} title={collapsed ? "Thème" : undefined}>
                    <div className="flex items-center w-full" onClick={(e) => e.stopPropagation()}>
                        <div className={cn("flex items-center w-full", collapsed ? "justify-center" : "gap-3")}>
                            {/* We render the toggle but we might need to customize it to fit the sidebar look. 
                                Actually, placing the ModeToggle button directly is easiest. 
                                Let's wrap it to look integrated. */}
                            <ModeToggle />
                            <span className={cn(
                                "whitespace-nowrap transition-all duration-300",
                                collapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                            )}>
                                Apparence
                            </span>
                        </div>
                    </div>
                </div>
                <form action="/auth/signout" method="post">
                    <button className={cn(
                        "flex items-center rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors h-10 w-full",
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
