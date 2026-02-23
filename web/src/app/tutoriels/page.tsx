import type { Metadata } from "next";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { TutorielsClient } from "./TutorielsClient";

export const metadata: Metadata = {
    title: "Tutoriels - Restaurant OS",
    description: "Découvrez nos tutoriels pour maîtriser Restaurant OS.",
};

export default async function TutorielsPage() {
    const supabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { data: tutorials } = await supabase
        .from("platform_tutorials")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

    return <TutorielsClient tutorials={tutorials || []} />;
}
