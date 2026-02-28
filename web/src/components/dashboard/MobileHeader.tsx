"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ModeToggle } from "@/components/mode-toggle";
import { useFCM } from "@/hooks/useFCM";

export function MobileHeader() {
    const { requestPermission, permissionStatus } = useFCM();

    return (
        <header className="md:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-card/95 backdrop-blur z-40 shrink-0">
            <Logo size="sm" showText href="/dashboard" className="text-secondary dark:text-foreground" />
            <div className="flex items-center gap-1">
                {permissionStatus === "default" && (
                    <Button variant="ghost" size="icon" onClick={requestPermission} aria-label="Activer les notifications">
                        <Bell className="h-5 w-5 animate-pulse" />
                    </Button>
                )}
                <ModeToggle />
            </div>
        </header>
    );
}
