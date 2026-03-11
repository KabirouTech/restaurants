"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireSuperAdminAction } from "@/lib/auth/super-admin";

async function verifySuperAdmin() {
    await requireSuperAdminAction();

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
            role: role || "member",
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

export async function bulkDeleteUsersAction(ids: string[]) {
    const admin = await verifySuperAdmin();

    const errors: string[] = [];
    for (const id of ids) {
        const { error: profileError } = await admin
            .from("profiles")
            .delete()
            .eq("id", id);
        if (profileError) { errors.push(profileError.message); continue; }

        const { error: authError } = await admin.auth.admin.deleteUser(id);
        if (authError) errors.push(authError.message);
    }

    revalidatePath("/admin/users");
    if (errors.length > 0) return { error: `${ids.length - errors.length}/${ids.length} supprimés. Erreurs: ${errors[0]}` };
    return { success: true };
}
