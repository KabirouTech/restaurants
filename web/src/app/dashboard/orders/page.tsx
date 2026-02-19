import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { ChefHat, Plus } from "lucide-react";
import Link from "next/link";
import { OrdersView } from "@/components/dashboard/orders/OrdersView";
import { DEFAULT_KANBAN_COLUMNS } from "@/components/dashboard/orders/KanbanBoard";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
    const supabaseUser = await createServerClient();
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) return <div>Non authentifié</div>;

    const { data: profile } = await supabaseUser.from("profiles").select("organization_id").eq("id", user.id).single();
    if (!profile?.organization_id) return <div>Aucune organisation</div>;
    const orgId = profile.organization_id;

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );

    // Fetch orders + org settings (for kanban columns) in parallel
    const [{ data: ordersData }, { data: org }] = await Promise.all([
        supabaseAdmin
            .from("orders")
            .select(`
                id, event_date, event_time, status,
                total_amount_cents, guest_count,
                customers (full_name, email, phone),
                capacity_types (name)
            `)
            .eq("organization_id", orgId)
            .order("created_at", { ascending: false }),
        supabaseAdmin
            .from("organizations")
            .select("settings")
            .eq("id", orgId)
            .single(),
    ]);

    const orders = ordersData || [];
    const settings = (org?.settings as Record<string, any>) || {};
    const kanbanColumns = settings.kanban_columns || DEFAULT_KANBAN_COLUMNS;
    const currency = settings.currency || "EUR";

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <div className="flex items-center gap-2 text-primary font-medium mb-1">
                        <ChefHat className="h-5 w-5" />
                        <span>Gestion</span>
                    </div>
                    <h1 className="text-3xl font-bold font-serif text-foreground">Devis & Commandes</h1>
                    <p className="text-muted-foreground mt-1">Gérez vos événements, devis et facturations.</p>
                </div>
                <Link href="/dashboard/orders/new">
                    <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm font-medium gap-2">
                        <Plus className="h-4 w-4" /> Nouveau Devis
                    </Button>
                </Link>
            </div>

            {/* Orders view (Kanban default) */}
            <OrdersView orders={orders as any} kanbanColumns={kanbanColumns} currency={currency} />
        </div>
    );
}
