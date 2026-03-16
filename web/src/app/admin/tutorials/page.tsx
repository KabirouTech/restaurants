import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { TutorialsClient } from "./TutorialsClient";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export default async function AdminTutorialsPage() {
    const { userId, profile } = await getCurrentProfile();
    if (!userId) redirect("/sign-in");
    if (!profile?.is_super_admin) redirect("/dashboard");

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { data: tutorials } = await supabaseAdmin
        .from("platform_tutorials")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

    return <TutorialsClient tutorials={tutorials || []} />;
}
