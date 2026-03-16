import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { CreateOrderForm } from "@/components/dashboard/orders/CreateOrderForm";
import { redirect } from "next/navigation";
import { ChefHat } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export default async function NewOrderPage() {
    const { userId, profile } = await getCurrentProfile();
    if (!userId) redirect("/sign-in");

    const supabase = await createClient();
    if (!profile?.organization_id) redirect("/dashboard/onboarding");
    const orgId = profile.organization_id;

    // 1. Fetch Products (Active Only)
    const { data: products } = await supabase
        .from("products")
        .select("id, name, description, price_cents, category")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("name");

    // 2. Fetch Capacity Types
    const { data: capacityTypes } = await supabase
        .from("capacity_types")
        .select("id, name")
        .eq("organization_id", orgId);

    // 3. Fetch Customers (Limit 50 for now, or implement async search later)
    const { data: customers } = await supabase
        .from("customers")
        .select("id, full_name, email, phone")
        .eq("organization_id", orgId)
        .order("full_name")
        .limit(100);

    // 4. Fetch Currency from Settings
    const { data: org } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", orgId)
        .single();
    const currency = (org?.settings as any)?.currency || "EUR";

    return (
        <div className="h-screen flex flex-col bg-background text-foreground animate-in fade-in duration-500 overflow-hidden">
            {/* Minimal Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-primary" />
                    <h1 className="text-xl font-bold font-serif text-foreground">Nouveau Devis</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto lg:overflow-hidden p-4 md:p-6 bg-muted/10">
                <Suspense fallback={<div>Chargement...</div>}>
                    <CreateOrderForm
                        products={products || []}
                        capacityTypes={capacityTypes || []}
                        customers={customers || []}
                        currency={currency}
                    />
                </Suspense>
            </main>
        </div>
    );
}
