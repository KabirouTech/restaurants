"use client";

import { useState } from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, Utensils, CalendarDays, Kanban, MessageCircle, ChevronLeft, Users, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function SettingsSidebar() {
    const t = useTranslations("dashboard.settings");
    const [collapsed, setCollapsed] = useState(false);

    const TABS = [
        { value: "general",  icon: Store,         label: t('sidebarShop') },
        { value: "menu",     icon: Utensils,      label: t('sidebarMenu') },
        { value: "capacity", icon: CalendarDays,  label: t('sidebarCapacity') },
        { value: "kanban",   icon: Kanban,        label: t('sidebarKanban') },
        { value: "channels", icon: MessageCircle, label: t('sidebarChannels') },
        { value: "members",  icon: Users,         label: t('sidebarMembers') },
        { value: "billing",  icon: CreditCard,    label: t('sidebarBilling') },
    ];

    const getSectionHeading = (value: string): string | null => {
        if (value === "general")  return t('headingCompany');
        if (value === "capacity") return t('headingOperations');
        if (value === "channels") return t('headingIntegrations');
        if (value === "members")  return t('headingTeamPlan');
        return null;
    };

    return (
        <div className={cn(
            "relative shrink-0 transition-all duration-300 ease-in-out",
            "sticky top-0 md:top-[160px] z-10 group",
            "bg-background md:bg-transparent",
            "border-b border-border md:border-0",
            collapsed ? "w-full md:w-[60px]" : "w-full md:w-64"
        )}>
            {/* Desktop collapse toggle */}
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    "absolute -right-3 top-2 h-6 w-6 rounded-full border border-border bg-card shadow-md z-20",
                    "text-muted-foreground hover:text-foreground hidden md:flex items-center justify-center transition-transform",
                    collapsed && "rotate-180"
                )}
                onClick={() => setCollapsed(!collapsed)}
            >
                <ChevronLeft className="h-3 w-3" />
            </Button>

            {/* ── MOBILE: icon-only horizontal strip ── */}
            <TabsList className="md:hidden flex flex-row items-center h-auto bg-transparent p-0 overflow-x-auto no-scrollbar px-2 py-2 gap-1 w-full justify-start">
                {TABS.map(({ value, icon: Icon, label }) => (
                    <TabsTrigger
                        key={value}
                        value={value}
                        title={label}
                        className={cn(
                            "flex flex-col items-center justify-center w-11 h-11 rounded-xl shrink-0",
                            "text-muted-foreground",
                            "data-[state=active]:bg-primary/15 data-[state=active]:text-primary",
                            "hover:bg-muted/60 data-[state=active]:shadow-none transition-all",
                            "border-2 border-transparent data-[state=active]:border-primary/30"
                        )}
                    >
                        <Icon className="h-[18px] w-[18px]" />
                    </TabsTrigger>
                ))}
            </TabsList>

            {/* ── DESKTOP: vertical sidebar ── */}
            <TabsList className="hidden md:flex flex-col justify-start items-stretch h-auto bg-transparent p-0 gap-1 w-full">
                {TABS.map(({ value, icon: Icon, label }) => {
                    const heading = getSectionHeading(value);
                    return (
                        <div key={value}>
                            {heading && (
                                <h3 className={cn(
                                    "text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 transition-all duration-300",
                                    value === "general" ? "mb-2 mt-4" : "mb-2 mt-6",
                                    collapsed ? "opacity-0 h-0 overflow-hidden mb-0 mt-2" : "opacity-100"
                                )}>
                                    {heading}
                                </h3>
                            )}
                            {collapsed && heading && <div className="h-6" />}
                            <TabsTrigger
                                value={value}
                                title={collapsed ? label : undefined}
                                className={cn(
                                    "w-full justify-start gap-3 px-3 py-2.5 text-sm font-medium",
                                    "data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none",
                                    "hover:bg-muted/50 transition-colors rounded-lg",
                                    collapsed && "justify-center px-0"
                                )}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span className={cn("transition-opacity whitespace-nowrap", collapsed && "hidden")}>
                                    {label}
                                </span>
                            </TabsTrigger>
                        </div>
                    );
                })}
            </TabsList>
        </div>
    );
}
