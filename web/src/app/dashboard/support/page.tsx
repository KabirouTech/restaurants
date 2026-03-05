import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { MessageSquareWarning } from "lucide-react";
import { SupportClient } from "@/components/dashboard/support/SupportClient";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
    const t = await getTranslations("dashboard.support");
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div>Non authentifié</div>;

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
    if (!profile?.organization_id) return <div>Aucune organisation</div>;

    const orgId = profile.organization_id;

    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
    );

    const { data: complaints } = await admin
        .from("complaints")
        .select("id, subject, description, photo_url, audio_url, status, admin_notes, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <header className="h-14 md:h-20 bg-background/80 backdrop-blur border-b border-border flex items-center px-4 md:px-8 shrink-0">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold font-serif flex items-center gap-2">
                        <MessageSquareWarning className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
                        {t("title")}
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground">
                        {t("subtitle")}
                    </p>
                </div>
            </header>

            <div className="p-4 md:p-8">
                <SupportClient complaints={complaints || []} />
            </div>
        </div>
    );
}
