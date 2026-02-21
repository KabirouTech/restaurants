import { Sidebar } from "@/components/dashboard/Sidebar";
import { AnnouncementBar } from "@/components/dashboard/AnnouncementBar";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check super admin status and onboarding
    let isSuperAdmin = false;
    let hasOrganization = true;
    if (user) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("is_super_admin, organization_id")
            .eq("id", user.id)
            .single();
        isSuperAdmin = profile?.is_super_admin === true;
        hasOrganization = !!profile?.organization_id;
    }

    // Redirect to onboarding if user has no organization
    if (user && !hasOrganization) {
        const headersList = await headers();
        const pathname = headersList.get("x-invoke-path") || "";
        if (!pathname.includes("/onboarding")) {
            redirect("/dashboard/onboarding");
        }
        return <>{children}</>;
    }

    // Fetch active announcements
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { data: announcements } = await supabaseAdmin
        .from("platform_announcements")
        .select("id, message, type, dismissible")
        .eq("is_active", true);

    return (
        <div className="flex flex-col h-[100dvh] overflow-hidden bg-muted/10 print:h-auto print:overflow-visible print:bg-white">
            <AnnouncementBar announcements={announcements || []} />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar isSuperAdmin={isSuperAdmin} />
                <main className="flex-1 overflow-y-auto h-full w-full print:h-auto print:w-full print:overflow-visible">
                    {children}
                </main>
            </div>
        </div>
    );
}
