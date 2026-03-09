import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileHeader } from "@/components/dashboard/MobileHeader";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { AnnouncementBar } from "@/components/dashboard/AnnouncementBar";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { PlanKey } from "@/lib/plans/plan-limits";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { userId, profile } = await getCurrentProfile();

    // Check super admin status, onboarding and plan
    let isSuperAdmin = false;
    let hasOrganization = true;
    let plan: PlanKey = "free";
    if (userId && profile) {
        isSuperAdmin = profile.is_super_admin === true;
        hasOrganization = !!profile.organization_id;

        if (profile.organization_id) {
            const supabaseAdmin = createAdminClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { persistSession: false } }
            );
            const { data: org } = await supabaseAdmin
                .from("organizations")
                .select("subscription_plan")
                .eq("id", profile.organization_id)
                .single();
            plan = (org?.subscription_plan as PlanKey) || "free";
        }
    }

    // No organization: render children only (no sidebar/announcement bar)
    // page.tsx handles the redirect to onboarding
    if (userId && !hasOrganization) {
        return <>{children}</>;
    }

    // Fetch active announcements
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const now = new Date().toISOString();
    const { data: announcements } = await supabaseAdmin
        .from("platform_announcements")
        .select("id, message, type, dismissible, link_url, link_label, emoji, animation, position, display_format")
        .eq("is_active", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`expires_at.is.null,expires_at.gte.${now}`);

    const activeAnnouncements = announcements || [];
    const hasBottomAnnouncements = activeAnnouncements.some(
        (a: { position?: string | null; display_format?: string | null }) =>
            a.position === "bottom" && a.display_format !== "popup"
    );

    return (
        <div className="flex flex-col h-[100dvh] overflow-hidden bg-muted/10 print:h-auto print:overflow-visible print:bg-white">
            <AnnouncementBar announcements={activeAnnouncements} />
            <MobileHeader />
            <div className="flex flex-1 overflow-hidden">
                <div className="hidden md:flex">
                    <Sidebar isSuperAdmin={isSuperAdmin} plan={plan} />
                </div>
                <main className={`flex-1 overflow-y-auto h-full w-full print:h-auto print:w-full print:overflow-visible pb-[72px] md:pb-0 ${hasBottomAnnouncements ? "md:pb-12" : ""}`}>
                    {children}
                </main>
            </div>
            <MobileBottomNav plan={plan} isSuperAdmin={isSuperAdmin} />
        </div>
    );
}
