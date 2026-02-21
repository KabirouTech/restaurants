import { ChefHat, Loader2 } from "lucide-react";

export default function NewOrderLoading() {
    return (
        <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
            <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-primary" />
                    <h1 className="text-xl font-bold font-serif text-foreground">Nouveau Devis</h1>
                </div>
            </header>
            <main className="flex-1 flex items-center justify-center bg-muted/10">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-medium">Chargement du formulaire...</p>
                </div>
            </main>
        </div>
    );
}
