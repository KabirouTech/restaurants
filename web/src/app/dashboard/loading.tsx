import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
            <header className="h-20 bg-background/80 backdrop-blur border-b border-border flex items-center px-8 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-foreground">Tableau de bord</h1>
                    <p className="text-sm text-muted-foreground font-light">Bonjour, voici le programme culinaire du jour.</p>
                </div>
            </header>
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-medium">Chargement...</p>
                </div>
            </div>
        </div>
    );
}
