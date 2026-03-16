import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CustomersTable } from "@/components/dashboard/customers/CustomersTable";
import { Users } from "lucide-react";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export default async function CustomersPage() {
    const t = await getTranslations("dashboard.customers");
    const tc = await getTranslations("common");
    const { userId, profile } = await getCurrentProfile();
    if (!userId) redirect("/sign-in");

    const supabase = await createClient();
    if (!profile?.organization_id) redirect("/dashboard/onboarding");

    // Fetch customers
    const { data: customers } = await supabase
        .from("customers")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false });

    return (
        <div className="h-screen flex flex-col bg-muted/10 animate-in fade-in duration-500 overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h1 className="text-xl font-bold font-serif text-foreground">{t('title')}</h1>
                </div>
            </header>

            <main className="flex-1 overflow-auto p-6">
                <Suspense fallback={<div>{tc('loading')}</div>}>
                    <CustomersTable initialCustomers={customers || []} />
                </Suspense>
            </main>
        </div>
    );
}
