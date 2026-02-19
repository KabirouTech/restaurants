"use server";

import { createClient as createServerClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createCustomerAction(formData: FormData) {
    const supabase = await createServerClient();

    // 1. Verify User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    // 2. Get Org ID
    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
    if (!profile?.organization_id) return { error: "Organisation introuvable" };

    const fullName = formData.get("full_name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const notes = formData.get("notes") as string;
    const source = formData.get("source") as string;

    try {
        const { error } = await supabase
            .from("customers")
            .insert({
                organization_id: profile.organization_id,
                full_name: fullName,
                email: email,
                phone: phone,
                notes: notes,
                source: source
            });

        if (error) {
            console.error("Create Customer Error:", error);
            return { error: "Erreur lors de la création du client." };
        }

        revalidatePath("/dashboard/customers");
        return { success: true };
    } catch (e) {
        return { error: "Une erreur inattendue est survenue." };
    }
}

export async function updateCustomerAction(formData: FormData) {
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const id = formData.get("id") as string;
    const fullName = formData.get("full_name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const notes = formData.get("notes") as string;
    const source = formData.get("source") as string;

    try {
        const { error } = await supabase
            .from("customers")
            .update({
                full_name: fullName,
                email: email,
                phone: phone,
                notes: notes,
                source: source
            })
            .eq("id", id);

        if (error) {
            console.error("Update Customer Error:", error);
            return { error: "Erreur lors de la mise à jour." };
        }

        revalidatePath("/dashboard/customers");
        return { success: true };
    } catch (e) {
        return { error: "Erreur inattendue." };
    }
}

export async function deleteCustomerAction(id: string) {
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    try {
        const { error } = await supabase
            .from("customers")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Delete Customer Error:", error);
            return { error: "Erreur lors de la suppression." };
        }

        revalidatePath("/dashboard/customers");
        return { success: true };
    } catch (e) {
        return { error: "Erreur inattendue." };
    }
}
