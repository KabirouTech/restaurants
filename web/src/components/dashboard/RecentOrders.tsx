import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RecentOrdersProps {
    organizationId: string;
    orders?: any[];
}

export function RecentOrders({ organizationId, orders = [] }: RecentOrdersProps) {
    if (orders.length === 0) {
        return (
            <Card className="bg-white border border-border shadow-sm text-foreground">
                <CardHeader className="bg-muted/10 pb-4 border-b border-border/50">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-sans">Commandes Récentes</h3>
                </CardHeader>
                <CardContent className="p-8 text-center text-muted-foreground">
                    <p className="text-sm">Aucune commande récente.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-card border border-border shadow-sm hover:shadow-lg transition-all text-foreground overflow-hidden">
            <CardHeader className="bg-muted/10 pb-4 border-b border-border/50">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest font-sans">Commandes Récentes</h3>
                    <a href="/dashboard/orders" className="text-xs font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-full transition-colors border border-primary/20">
                        Tout voir
                    </a>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                    {orders.map((order, i) => {
                        const customerName = order.customers?.full_name || "Client";
                        const initials = customerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                        const statusColor = order.status === 'confirmed' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" :
                            order.status === 'draft' ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700" :
                                "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800";

                        return (
                            <div key={order.id} className="flex items-center justify-between group cursor-pointer hover:bg-muted/30 p-4 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-secondary/10 dark:bg-secondary/20 flex items-center justify-center font-bold text-secondary dark:text-secondary-foreground text-xs font-serif group-hover:bg-secondary group-hover:text-white transition-all border border-secondary/20 shadow-sm">
                                        {initials}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-secondary dark:text-secondary-foreground font-serif group-hover:text-primary transition-colors">{customerName}</p>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            {(order.total_amount_cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${statusColor}`}>
                                        {order.status === 'draft' ? 'Brouillon' : order.status}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-bold">
                                        {order.event_date ? format(new Date(order.event_date), "dd MMM", { locale: fr }) : format(new Date(order.created_at), "dd MMM", { locale: fr })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
