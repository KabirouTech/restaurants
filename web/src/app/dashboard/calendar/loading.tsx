import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CalendarLoading() {
    return (
        <div className="flex flex-col h-screen bg-background text-foreground animate-in fade-in duration-500 overflow-hidden">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-card shadow-sm shrink-0 z-10">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
                        <div className="h-6 w-24 bg-muted animate-pulse rounded-full" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-muted/30 p-1 rounded-lg border border-border flex items-center mr-4">
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled><ChevronLeft className="h-4 w-4 text-muted-foreground/30" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs font-medium px-2 text-muted-foreground/30" disabled>Aujourd'hui</Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled><ChevronRight className="h-4 w-4 text-muted-foreground/30" /></Button>
                    </div>

                    <button
                        className="inline-flex items-center gap-1.5 bg-primary/50 text-white/50 shadow-sm font-medium text-sm h-9 px-4 rounded-md cursor-not-allowed"
                        disabled
                    >
                        <Plus className="h-4 w-4" /> Nouveau
                    </button>
                </div>
            </div>

            {/* Calendar Grid Container */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Week Header */}
                <div className="grid grid-cols-7 border-b border-border bg-muted/60 shrink-0">
                    {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((day, i) => (
                        <div key={i} className="py-2 text-xs font-semibold text-center text-muted-foreground uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid Skeleton */}
                <div className="grid grid-cols-7 grid-rows-5 flex-1 overflow-y-auto">
                    {Array.from({ length: 35 }).map((_, i) => (
                        <div
                            key={i}
                            className="min-h-[120px] border-b border-r border-border relative flex flex-col bg-card"
                        >
                            {/* Day Number Header */}
                            <div className="flex justify-between items-start p-2 border-b border-border/50 bg-muted/20">
                                <span className="h-6 w-6 flex items-center justify-center rounded-full text-sm font-medium text-muted-foreground/40 bg-muted/50 animate-pulse">
                                    0
                                </span>
                            </div>

                            {/* Events area skeleton */}
                            <div className="flex-1 relative p-1.5 pt-2 flex flex-wrap gap-1.5 content-start">
                                {Math.random() > 0.7 && (
                                    <>
                                        <div className="h-6 w-full bg-primary/10 animate-pulse rounded-md" />
                                        {Math.random() > 0.5 && <div className="h-6 w-full bg-muted animate-pulse rounded-md" />}
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
