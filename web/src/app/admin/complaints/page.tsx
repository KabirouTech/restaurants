import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { MessageSquareWarning, Clock, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { ComplaintsClient } from "@/components/admin/ComplaintsClient";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export const dynamic = "force-dynamic";

export default async function AdminComplaintsPage() {
    const { userId, profile } = await getCurrentProfile();
    if (!userId) redirect("/sign-in");
    if (!profile?.is_super_admin) redirect("/dashboard");

    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { data: complaints } = await admin
        .from("complaints")
        .select(`
            id, subject, description, photo_url, audio_url,
            status, admin_notes, created_at,
            organizations ( id, name ),
            profiles!complaints_submitted_by_fkey ( full_name )
        `)
        .order("created_at", { ascending: false });

    const all = complaints || [];
    const open = all.filter((c) => c.status === "open").length;
    const inProgress = all.filter((c) => c.status === "in_progress").length;
    const resolved = all.filter((c) => c.status === "resolved").length;
    const closed = all.filter((c) => c.status === "closed").length;

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="h-14 md:h-20 bg-background/80 backdrop-blur border-b border-border flex items-center px-4 md:px-8 shrink-0">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold font-serif flex items-center gap-2">
                        <MessageSquareWarning className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
                        Plaintes & Signalements
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        {open + inProgress} en attente · {resolved + closed} traités
                    </p>
                </div>
            </header>

            <div className="p-4 md:p-8 space-y-4 md:space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <MiniStat icon={<Clock className="h-4 w-4" />} color="text-amber-500 bg-amber-50 dark:bg-amber-950/30" label="Ouvert" value={open} />
                    <MiniStat icon={<ArrowRight className="h-4 w-4" />} color="text-blue-500 bg-blue-50 dark:bg-blue-950/30" label="En cours" value={inProgress} />
                    <MiniStat icon={<CheckCircle2 className="h-4 w-4" />} color="text-green-500 bg-green-50 dark:bg-green-950/30" label="Résolu" value={resolved} />
                    <MiniStat icon={<XCircle className="h-4 w-4" />} color="text-gray-500 bg-gray-50 dark:bg-gray-800/30" label="Fermé" value={closed} />
                </div>

                <ComplaintsClient complaints={all as any} />
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
