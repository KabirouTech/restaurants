"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

async function getOrgContext() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

    if (!profile?.organization_id) throw new Error("Aucune organisation");

    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    return { admin, orgId: profile.organization_id };
}

function revalidateCalendar() {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/calendar");
}

export async function closeDateAction(formData: FormData) {
    const date = formData.get("date") as string;
    const reason = (formData.get("reason") as string) || null;

    if (!date) return { error: "La date est requise" };

    try {
        const { admin, orgId } = await getOrgContext();

        const { error } = await admin
            .from("calendar_overrides")
            .upsert(
                {
                    organization_id: orgId,
                    date,
                    is_blocked: true,
                    reason,
                },
                { onConflict: "organization_id,date" }
            );

        if (error) return { error: error.message };

        revalidateCalendar();
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function openDateAction(date: string) {
    if (!date) return { error: "La date est requise" };

    try {
        const { admin, orgId } = await getOrgContext();

        const { error } = await admin
            .from("calendar_overrides")
            .delete()
            .eq("organization_id", orgId)
            .eq("date", date);

        if (error) return { error: error.message };

        revalidateCalendar();
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}
