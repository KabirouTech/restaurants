import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { Image } from "lucide-react";
import { BannersClient } from "./BannersClient";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export default async function AdminBannersPage() {
    const { userId, profile } = await getCurrentProfile();
    if (!userId) redirect("/sign-in");
    if (!profile?.is_super_admin) redirect("/dashboard");

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { data: banners } = await supabaseAdmin
        .from("platform_banners")
        .select("*")
        .order("created_at", { ascending: false });

    return <BannersClient banners={banners || []} />;
}
