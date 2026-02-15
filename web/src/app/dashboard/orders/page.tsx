import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChefHat, FilePenLine, Plus, Search, Eye } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
    // 1. Verify Authentication (Cookie Client)
    const supabaseUser = await createServerClient();
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) return <div>Non authentifié</div>;

    // 2. Get Organization ID
    const { data: profile } = await supabaseUser.from("profiles").select("organization_id").eq("id", user.id).single();
    if (!profile?.organization_id) return <div>Aucune organisation</div>;

    // 3. Fetch Orders using Service Role Client (Bypass RLS)
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        }
    );

    const { data: ordersData, error: ordersError } = await supabaseAdmin
        .from("orders")
        .select(`
            id,
            created_at,
            event_date,
            event_time,
            status,
            total_amount_cents,
            guest_count,
            customers (full_name, email, phone),
            capacity_types (name)
        `)
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false });

    if (ordersError) {
        console.error("Error fetching orders:", ordersError);
    }

    const orders = ordersData || [];

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <div className="flex items-center gap-2 text-primary font-medium mb-1">
                        <ChefHat className="h-5 w-5" />
                        <span>Gestion</span>
                    </div>
                    <h1 className="text-3xl font-bold font-serif text-secondary">
                        Devis & Commandes
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gérez vos événements, devis et facturations.
                    </p>
                </div>

                <Link href="/dashboard/orders/new">
                    <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm font-medium gap-2">
                        <Plus className="h-4 w-4" /> Nouveau Devis
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Rechercher un client, N° devis..." className="pl-9 bg-white" />
                </div>
                {/* Placeholder for status filter */}
            </div>

            {/* Orders List */}
            <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="w-[100px]">Date</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders && orders.length > 0 ? (
                            orders.map((order: any) => {
                                const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
                                const capacityType = Array.isArray(order.capacity_types) ? order.capacity_types[0] : order.capacity_types;

                                return (
                                    <TableRow key={order.id} className="hover:bg-muted/5 group relative">
                                        <TableCell className="font-medium relative">
                                            <Link href={`/dashboard/orders/${order.id}`} className="absolute inset-0 z-10" />
                                            <div className="flex flex-col relative z-0 pointer-events-none">
                                                <span>{order.event_date ? format(new Date(order.event_date), "dd MMM yyyy", { locale: fr }) : format(new Date(order.created_at), "dd MMM yyyy", { locale: fr })}</span>
                                                <span className="text-xs text-muted-foreground">{order.event_time ? order.event_time.slice(0, 5) : (order.event_date ? "Heure à définir" : "Date de création")}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col relative z-0">
                                                <span className="font-medium text-secondary">{customer?.full_name || "Client Inconnu"}</span>
                                                <span className="text-xs text-muted-foreground">{customer?.phone}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary relative z-0">
                                                {capacityType?.name || "Standard"} {order.guest_count ? `(${order.guest_count} pers.)` : ""}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border relative z-0 ${order.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                order.status === 'draft' ? 'bg-gray-50 text-gray-600 border-gray-200' :
                                                    'bg-orange-50 text-orange-700 border-orange-200'
                                                }`}>
                                                {order.status === 'draft' ? 'Brouillon' :
                                                    order.status === 'quotation' ? 'Devis Envoyé' :
                                                        order.status === 'confirmed' ? 'Confirmé' : order.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-medium relative z-0">
                                            {((order.total_amount_cents || 0) / 100).toFixed(2)} €
                                        </TableCell>
                                        <TableCell>
                                            <Link href={`/dashboard/orders/${order.id}`}>
                                                <Button variant="ghost" size="icon" className="group-hover:opacity-100 transition-opacity">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Aucune commande trouvée. Créez votre premier devis !
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
