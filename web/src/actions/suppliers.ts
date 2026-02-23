"use server";

import { createClient as createServerClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createSupplierAction(formData: FormData) {
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
    if (!profile?.organization_id) return { error: "Organisation introuvable" };

    const name = formData.get("name") as string;
    const contact_name = formData.get("contact_name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const notes = formData.get("notes") as string;

    try {
        const { error } = await supabase
            .from("suppliers")
            .insert({
                organization_id: profile.organization_id,
                name,
                contact_name: contact_name || null,
                email: email || null,
                phone: phone || null,
                address: address || null,
                notes: notes || null,
            });

        if (error) {
            console.error("Create Supplier Error:", error);
            return { error: "Erreur lors de la création du fournisseur." };
        }

        revalidatePath("/dashboard/suppliers");
        return { success: true };
    } catch {
        return { error: "Une erreur inattendue est survenue." };
    }
}

export async function quickCreateSupplierAction(input: {
    name: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
}) {
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
    if (!profile?.organization_id) return { error: "Organisation introuvable" };

    if (!input.name?.trim()) return { error: "Le nom est requis." };

    const { data, error } = await supabase
        .from("suppliers")
        .insert({
            organization_id: profile.organization_id,
            name: input.name.trim(),
            contact_name: input.contact_name?.trim() || null,
            email: input.email?.trim() || null,
            phone: input.phone?.trim() || null,
            address: input.address?.trim() || null,
            notes: input.notes?.trim() || null,
        })
        .select("id, name")
        .single();

    if (error) {
        console.error("Quick Create Supplier Error:", error);
        return { error: "Erreur lors de la création du fournisseur: " + error.message };
    }

    revalidatePath("/dashboard/suppliers");
    revalidatePath("/dashboard/inventory");
    return { success: true, supplier: data };
}

export async function updateSupplierAction(formData: FormData) {
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const contact_name = formData.get("contact_name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const notes = formData.get("notes") as string;

    try {
        const { error } = await supabase
            .from("suppliers")
            .update({
                name,
                contact_name: contact_name || null,
                email: email || null,
                phone: phone || null,
                address: address || null,
                notes: notes || null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        if (error) {
            console.error("Update Supplier Error:", error);
            return { error: "Erreur lors de la mise à jour." };
        }

        revalidatePath("/dashboard/suppliers");
        return { success: true };
    } catch {
        return { error: "Erreur inattendue." };
    }
}

export async function deleteSupplierAction(id: string) {
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    try {
        const { error } = await supabase
            .from("suppliers")
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq("id", id);

        if (error) {
            console.error("Delete Supplier Error:", error);
            return { error: "Erreur lors de la suppression." };
        }

        revalidatePath("/dashboard/suppliers");
        return { success: true };
    } catch {
        return { error: "Erreur inattendue." };
    }
}

export async function bulkDeleteSuppliersAction(ids: string[]) {
    if (!ids.length) return { error: "Aucun fournisseur sélectionné." };

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
    if (!profile?.organization_id) return { error: "Organisation introuvable" };

    const { error } = await supabase
        .from("suppliers")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in("id", ids)
        .eq("organization_id", profile.organization_id);

    if (error) return { error: "Erreur lors de la suppression : " + error.message };

    revalidatePath("/dashboard/suppliers");
    return { success: true, count: ids.length };
}

export async function importSuppliersAction(rows: {
    name: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
}[]) {
    const supabase = await createServerClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
    if (!profile?.organization_id) return { error: "Organisation introuvable" };

    if (!rows.length) return { error: "Aucune ligne à importer." };

    const valid = rows.filter(r => r.name?.trim());
    if (!valid.length) return { error: "Aucun fournisseur valide trouvé (colonne 'Nom' manquante)." };

    const payload = valid.map(r => ({
        organization_id: profile.organization_id,
        name: r.name.trim(),
        contact_name: r.contact_name?.trim() || null,
        email: r.email?.trim() || null,
        phone: r.phone?.trim() || null,
        address: r.address?.trim() || null,
        notes: r.notes?.trim() || null,
    }));

    let inserted = 0;
    const errors: string[] = [];

    for (const supplier of payload) {
        const { error } = await supabase.from("suppliers").insert(supplier);
        if (!error) {
            inserted++;
        } else if (error.code !== "23505") {
            errors.push(error.message);
        }
    }

    revalidatePath("/dashboard/suppliers");

    if (inserted === 0 && errors.length > 0) {
        return { error: `Echec de l'import : ${errors[0]}` };
    }

    return { success: true, count: inserted };
}
