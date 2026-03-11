"use server";

import { createClient as createServerClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getRequiredOrganizationContext } from "@/lib/auth/organization-context";

export async function createCustomerAction(formData: FormData) {
    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };

    const supabase = await createServerClient();
    const { organizationId } = orgContext.context;

    const fullName = formData.get("full_name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const notes = formData.get("notes") as string;
    const source = formData.get("source") as string;

    try {
        const { error } = await supabase
            .from("customers")
            .insert({
                organization_id: organizationId,
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
    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };

    const supabase = await createServerClient();
    const { organizationId } = orgContext.context;

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
            .eq("id", id)
            .eq("organization_id", organizationId);

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
    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };

    const supabase = await createServerClient();
    const { organizationId } = orgContext.context;

    try {
        const { error } = await supabase
            .from("customers")
            .delete()
            .eq("id", id)
            .eq("organization_id", organizationId);

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

export async function importCustomersAction(rows: {
    full_name: string;
    email?: string;
    phone?: string;
    notes?: string;
    source?: string;
}[]) {
    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };

    const supabase = await createServerClient();
    const { organizationId } = orgContext.context;

    if (!rows.length) return { error: "Aucune ligne à importer." };

    // Filter out rows without a name
    const valid = rows.filter(r => r.full_name?.trim());
    if (!valid.length) return { error: "Aucun client valide trouvé (colonne 'Nom' manquante)." };

    // Build payload — omit source if column might not exist yet
    const payload = valid.map(r => ({
        organization_id: organizationId,
        full_name: r.full_name.trim(),
        email: r.email?.trim() || null,
        phone: r.phone?.trim() || null,
        notes: r.notes?.trim() || null,
    }));

    let inserted = 0;
    const errors: string[] = [];

    // Insert one by one to handle duplicates gracefully
    for (const customer of payload) {
        const { error } = await supabase.from("customers").insert(customer);
        if (!error) {
            inserted++;
        } else if (error.code !== "23505") {
            // 23505 = unique violation (duplicate) — skip silently
            errors.push(error.message);
        }
    }

    revalidatePath("/dashboard/customers");

    if (inserted === 0 && errors.length > 0) {
        return { error: `Echec de l'import : ${errors[0]}` };
    }

    return { success: true, count: inserted };
}
export async function bulkDeleteCustomersAction(ids: string[]) {
    if (!ids.length) return { error: "Aucun client sélectionné." };

    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };

    const supabase = await createServerClient();
    const { organizationId } = orgContext.context;

    const { error } = await supabase
        .from("customers")
        .delete()
        .in("id", ids)
        .eq("organization_id", organizationId); // safety scope

    if (error) return { error: "Erreur lors de la suppression : " + error.message };

    revalidatePath("/dashboard/customers");
    return { success: true, count: ids.length };
}
