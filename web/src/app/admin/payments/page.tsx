import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { CreditCard, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { PaymentsClient } from "./PaymentsClient";

export default async function AdminPaymentsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .single();
    if (!profile?.is_super_admin) redirect("/dashboard");

    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { data: requests } = await admin
        .from("upgrade_requests")
        .select(`
            *,
            organizations ( id, name, slug ),
            profiles!upgrade_requests_requested_by_fkey ( full_name )
        `)
        .order("created_at", { ascending: false });

    const all = requests || [];

    const pending    = all.filter(r => r.status === "pending").length;
    const processing = all.filter(r => r.status === "processing").length;
    const completed  = all.filter(r => r.status === "completed").length;
    const rejected   = all.filter(r => r.status === "rejected").length;

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="h-20 bg-background/80 backdrop-blur border-b border-border flex items-center px-8 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
                        <CreditCard className="h-6 w-6 text-green-500" />
                        Paiements & Upgrades
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {pending + processing} en attente · {completed} traités
                    </p>
                </div>
            </header>

            <div className="p-6 md:p-8 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <MiniStat icon={<Clock className="h-4 w-4" />} color="text-amber-500 bg-amber-50" label="En attente" value={pending} />
                    <MiniStat icon={<AlertCircle className="h-4 w-4" />} color="text-blue-500 bg-blue-50" label="En cours" value={processing} />
                    <MiniStat icon={<CheckCircle2 className="h-4 w-4" />} color="text-green-500 bg-green-50" label="Approuvés" value={completed} />
                    <MiniStat icon={<XCircle className="h-4 w-4" />} color="text-red-500 bg-red-50" label="Rejetés" value={rejected} />
                </div>

                {/* Table interactive (client) */}
                <PaymentsClient requests={all} />
            </div>
        </div>
    );
}

function MiniStat({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: number }) {
    return (
        <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
            <div>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className="text-2xl font-bold font-serif">{value}</p>
            </div>
        </div>
    );
}
