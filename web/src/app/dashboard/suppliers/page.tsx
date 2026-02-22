import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SuppliersTable } from "@/components/dashboard/suppliers/SuppliersTable";
import { Truck } from "lucide-react";
import { Suspense } from "react";

export default async function SuppliersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

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
                        <h1 className="text-xl font-bold font-serif text-foreground">Fournisseurs</h1>
                        <p className="text-sm text-muted-foreground">Gérez vos fournisseurs et contacts.</p>
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
