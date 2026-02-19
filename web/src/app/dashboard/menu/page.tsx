import { createClient } from "@/utils/supabase/server";
import { MenuGrid } from "@/components/dashboard/menu/MenuGrid";
import { ProductDialog } from "@/components/dashboard/menu/ProductDialog";
import { ImportMenuDialog } from "@/components/dashboard/menu/ImportMenuDialog";
import { redirect } from "next/navigation";
import { ChefHat } from "lucide-react";

export default async function MenuPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login");

    // Fetch Profile Org ID
    const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
    if (!profile?.organization_id) redirect("/dashboard/onboarding");

    // Fetch Products (Active Only)
    // Fetch Products (Active Only)
    const { data: products } = await supabase
        .from("products")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    // Fetch Organization Settings
    const { data: org } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", profile.organization_id)
        .single();

    const currency = (org?.settings as any)?.currency || "EUR";

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
                <div>
                    <div className="flex items-center gap-2 text-primary font-medium mb-1">
                        <ChefHat className="h-5 w-5" />
                        <span>Carte & Menus</span>
                    </div>
                    <h1 className="text-3xl font-bold font-serif text-foreground">
                        Gestion du Menu
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Ajoutez, modifiez ou supprimez vos plats. Ils apparaîtront instantanément sur vos devis.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <ImportMenuDialog />
                    <ProductDialog currency={currency} />
                </div>
            </div>

            {/* Content */}
            <MenuGrid products={products || []} currency={currency} />
        </div>
    );
}
