import { Loader2, CalendarDays } from "lucide-react";

export default function CalendarLoading() {
    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2 text-primary font-medium mb-1">
                <CalendarDays className="h-5 w-5" />
                <span>Calendrier</span>
            </div>
            <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-medium">Chargement du calendrier...</p>
                </div>
            </div>
        </div>
    );
}
