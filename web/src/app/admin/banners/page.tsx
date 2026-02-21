import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { Image } from "lucide-react";
import { BannersClient } from "./BannersClient";

export default async function AdminBannersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .single();
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
