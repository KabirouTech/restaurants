"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

async function verifySuperAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .single();

    if (!profile?.is_super_admin) throw new Error("Accès refusé");

    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );
}

export async function updateUserAction(id: string, formData: FormData) {
    const admin = await verifySuperAdmin();

    const full_name = formData.get("full_name") as string;
    const role = formData.get("role") as string;
    const organization_id = formData.get("organization_id") as string;
    const is_super_admin = formData.get("is_super_admin") === "true";

    if (!full_name) return { error: "Le nom est requis" };

    const { error } = await admin
        .from("profiles")
        .update({
            full_name,
            role: role || "staff",
            organization_id: organization_id || null,
            is_super_admin,
        })
        .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/users");
    return { success: true };
}

export async function deleteUserAction(id: string) {
    const admin = await verifySuperAdmin();

    const { error: profileError } = await admin
        .from("profiles")
        .delete()
        .eq("id", id);

    if (profileError) return { error: profileError.message };

    const { error: authError } = await admin.auth.admin.deleteUser(id);

    if (authError) return { error: authError.message };

    revalidatePath("/admin/users");
    return { success: true };
}
