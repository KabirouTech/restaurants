import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SuppliersTable } from "@/components/dashboard/suppliers/SuppliersTable";
import { Truck } from "lucide-react";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export default async function SuppliersPage() {
    const t = await getTranslations("dashboard.suppliers");
    const { userId, profile } = await getCurrentProfile();
    if (!userId) redirect("/sign-in");

    const supabase = await createClient();
    if (!profile?.organization_id) redirect("/dashboard/onboarding");

    const { data: suppliers } = await supabase
        .from("suppliers")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

    return (
        <div className="h-screen flex flex-col bg-muted/10 animate-in fade-in duration-500 overflow-hidden">
            <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-primary" />
                    <div>
                        <h1 className="text-xl font-bold font-serif text-foreground">{t('title')}</h1>
                        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-auto p-6">
                <Suspense fallback={<div>Chargement...</div>}>
                    <SuppliersTable suppliers={suppliers || []} />
                </Suspense>
            </main>
        </div>
    );
}
