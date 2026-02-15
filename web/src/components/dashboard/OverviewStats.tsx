import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, MessageSquare, ShoppingBag, TrendingUp } from "lucide-react";

interface OverviewStatsProps {
    organizationId: string;
    totalRevenueCents: number;
    orderCount: number;
}

export function OverviewStats({ organizationId, totalRevenueCents, orderCount }: OverviewStatsProps) {
    // In a real implementation, we would fetch data using organizationId.
    // For now, we'll keep the static data but update the UI to match Teranga theme.

    const stats = [
        {
            title: "Chiffre d'affaires",
            value: (totalRevenueCents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
            description: "+0%",
            icon: DollarSign,
            color: "text-primary bg-primary/10",
        },
        {
            title: "Commandes",
            value: orderCount.toString(),
            description: "Nouveau",
            icon: ShoppingBag,
            color: "text-secondary bg-secondary/10",
        },
        {
            title: "Messages",
            value: "0",
            description: "Inbox",
            icon: MessageSquare,
            color: "text-purple-600 bg-purple-100",
        },
        {
            title: "Satisfaction",
            value: "-",
            description: "NPS",
            icon: TrendingUp,
            color: "text-green-600 bg-green-100",
        },
    ];

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
                <Card key={index} className="bg-white border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between pb-4">
                            <div>
                                <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2 font-sans">{stat.title}</p>
                                <h3 className="text-3xl font-bold text-secondary font-serif tracking-tight">{stat.value}</h3>
                            </div>
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center border border-transparent ${stat.color}`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                            <span className="text-xs text-primary font-bold bg-primary/5 px-2 py-1 rounded-full border border-primary/10">
                                {stat.description}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">depuis hier</span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
