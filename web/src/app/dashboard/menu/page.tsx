import { createClient } from "@/utils/supabase/server";
import { MenuGrid } from "@/components/dashboard/menu/MenuGrid";
import { ProductDialog } from "@/components/dashboard/menu/ProductDialog";
import { ImportMenuDialog } from "@/components/dashboard/menu/ImportMenuDialog";
import { redirect } from "next/navigation";
import { ChefHat } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export default async function MenuPage() {
    const t = await getTranslations("dashboard.menu");
    const { userId, profile } = await getCurrentProfile();
    if (!userId) redirect("/sign-in");

    const supabase = await createClient();
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
        <div className="min-h-screen p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="border-b border-border pb-4 md:pb-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-primary font-medium mb-1">
                            <ChefHat className="h-4 w-4 shrink-0" />
                            <span className="text-sm">{t('label')}</span>
                        </div>
                        <h1 className="text-xl md:text-3xl font-bold font-serif text-foreground truncate">
                            {t('pageTitle')}
                        </h1>
                        <p className="text-muted-foreground mt-1 text-xs md:text-base hidden sm:block">
                            {t('pageSubtitle')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <ImportMenuDialog currency={currency} />
                        <ProductDialog currency={currency} />
                    </div>
                </div>
            </div>

            {/* Content */}
            <MenuGrid products={products || []} currency={currency} />
        </div>
    );
}
