"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list";

interface ViewToggleProps {
    view: ViewMode;
    onChange: (view: ViewMode) => void;
    className?: string;
}

/**
 * A compact grid/list toggle button pair.
 */
export function ViewToggle({ view, onChange, className }: ViewToggleProps) {
    return (
        <div className={cn("flex items-center rounded-lg border border-border bg-muted/40 p-0.5 gap-0.5", className)}>
            <button
                onClick={() => onChange("grid")}
                className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-md transition-all",
                    view === "grid"
                        ? "bg-background shadow-sm text-primary"
                        : "text-muted-foreground hover:text-secondary"
                )}
                title="Vue grille"
                aria-label="Vue grille"
            >
                <LayoutGrid className="h-4 w-4" />
            </button>
            <button
                onClick={() => onChange("list")}
                className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-md transition-all",
                    view === "list"
                        ? "bg-background shadow-sm text-primary"
                        : "text-muted-foreground hover:text-secondary"
                )}
                title="Vue liste"
                aria-label="Vue liste"
            >
                <List className="h-4 w-4" />
            </button>
        </div>
    );
}
