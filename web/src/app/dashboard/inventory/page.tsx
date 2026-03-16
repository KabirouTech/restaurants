import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { IngredientsTable } from "@/components/dashboard/inventory/IngredientsTable";
import { Package, AlertTriangle } from "lucide-react";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export default async function InventoryPage() {
    const t = await getTranslations("dashboard.inventory");
    const tc = await getTranslations("common");
    const { userId, profile } = await getCurrentProfile();
    if (!userId) redirect("/sign-in");

    const supabase = await createClient();
    if (!profile?.organization_id) redirect("/dashboard/onboarding");

    // Parallel queries
    const [ingredientsRes, suppliersRes, orgRes] = await Promise.all([
        supabase
            .from("ingredients")
            .select("*")
            .eq("organization_id", profile.organization_id)
            .eq("is_active", true)
            .order("created_at", { ascending: false }),
        supabase
            .from("suppliers")
            .select("id, name")
            .eq("organization_id", profile.organization_id)
            .eq("is_active", true)
            .order("name"),
        supabase
            .from("organizations")
            .select("settings")
            .eq("id", profile.organization_id)
            .single(),
    ]);

    const ingredients = ingredientsRes.data || [];
    const suppliers = suppliersRes.data || [];
    const currency = (orgRes.data?.settings as any)?.currency || "EUR";

    const lowStockCount = ingredients.filter(
        (i) => i.low_stock_threshold > 0 && i.current_stock < i.low_stock_threshold
    ).length;

    return (
        <div className="h-screen flex flex-col bg-muted/10 animate-in fade-in duration-500 overflow-hidden">
            <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-primary" />
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold font-serif text-foreground">{t('title')}</h1>
                            {lowStockCount > 0 && (
                                <Badge variant="destructive" className="gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {t('lowStockAlert', { count: lowStockCount })}
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-auto p-6">
                <Suspense fallback={<div>{tc('loading')}</div>}>
                    <IngredientsTable ingredients={ingredients} suppliers={suppliers} currency={currency} />
                </Suspense>
            </main>
        </div>
    );
}
