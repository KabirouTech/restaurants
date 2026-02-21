import { ChefHat, Loader2 } from "lucide-react";

export default function OrdersLoading() {
    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <div className="flex items-center gap-2 text-primary font-medium mb-1">
                        <ChefHat className="h-5 w-5" />
                        <span>Gestion</span>
                    </div>
                    <h1 className="text-3xl font-bold font-serif text-foreground">Devis & Commandes</h1>
                    <p className="text-muted-foreground mt-1">Gérez vos événements, devis et facturations.</p>
                </div>
            </div>
            <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-medium">Chargement des commandes...</p>
                </div>
            </div>
        </div>
    );
}
