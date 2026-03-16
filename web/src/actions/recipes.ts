"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { getRequiredOrganizationContext } from "@/lib/auth/organization-context";
import { randomUUID } from "node:crypto";

export type RecipeUpsertInput = {
    id?: string;
    organizationId?: string;
    productId?: string | null;
    name: string;
    description?: string;
    category?: string;
    servings?: number | null;
    prepTimeMinutes?: number | null;
    cookTimeMinutes?: number | null;
    instructions?: string;
    ingredientsList?: { name: string; quantity: string; unit: string }[];
    images?: string[];
    audioUrl?: string | null;
    audioTranscript?: string | null;
    audioLanguage?: 'fr' | 'en' | null;
    tags?: string[];
    isPrivate?: boolean;
};

export async function upsertRecipeAction(input: RecipeUpsertInput) {
    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };
    const { organizationId } = orgContext.context;

    const supabase = await createClient();

    if (input.productId) {
        const { data: scopedProduct, error: scopedProductError } = await supabase
            .from("products")
            .select("id")
            .eq("id", input.productId)
            .eq("organization_id", organizationId)
            .maybeSingle();

        if (scopedProductError) return { error: scopedProductError.message };
        if (!scopedProduct) return { error: "Produit introuvable pour cette organisation" };
    }

    const payload = {
        organization_id:    organizationId,
        product_id:         input.productId ?? null,
        name:               input.name,
        description:        input.description ?? null,
        category:           input.category ?? null,
        servings:           input.servings ?? null,
        prep_time_minutes:  input.prepTimeMinutes ?? null,
        cook_time_minutes:  input.cookTimeMinutes ?? null,
        instructions:       input.instructions ?? null,
        ingredients_list:   input.ingredientsList ?? [],
        images:             input.images ?? [],
        audio_url:          input.audioUrl ?? null,
        audio_transcript:   input.audioTranscript ?? null,
        audio_language:     input.audioLanguage ?? null,
        tags:               input.tags ?? [],
        is_private:         input.isPrivate ?? false,
    };

    let result;
    if (input.id) {
        result = await supabase
            .from("recipes")
            .update(payload)
            .eq("id", input.id)
            .eq("organization_id", organizationId)
            .select("id")
            .maybeSingle();
    } else {
        result = await supabase
            .from("recipes")
            .insert(payload)
            .select("id")
            .maybeSingle();
    }

    if (result.error) return { error: result.error.message };
    if (!result.data?.id) return { error: "Recette introuvable pour cette organisation" };

    revalidatePath("/dashboard/recipes");
    return { success: true, id: result.data.id };
}

export async function deleteRecipeAction(id: string) {
    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };
    const { organizationId } = orgContext.context;

    const supabase = await createClient();

    const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);
    if (error) return { error: error.message };

    revalidatePath("/dashboard/recipes");
    return { success: true };
}

export type RecipeImportRow = {
    name: string;
    description?: string;
    category?: string;
    servings?: number | null;
    prep_time_minutes?: number | null;
    cook_time_minutes?: number | null;
    instructions?: string;
    ingredients_list?: { name: string; quantity: string; unit: string }[];
    tags?: string[];
    is_private?: boolean;
};

export async function importRecipesAction(organizationId: string, rows: RecipeImportRow[]) {
    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };
    const { organizationId: scopedOrganizationId } = orgContext.context;

    if (organizationId !== scopedOrganizationId) {
        return { error: "Organisation non autorisée" };
    }

    const supabase = await createClient();

    const payload = rows.map(r => ({
        organization_id:   scopedOrganizationId,
        name:              r.name,
        description:       r.description ?? null,
        category:          r.category ?? null,
        servings:          r.servings ?? null,
        prep_time_minutes: r.prep_time_minutes ?? null,
        cook_time_minutes: r.cook_time_minutes ?? null,
        instructions:      r.instructions ?? null,
        ingredients_list:  r.ingredients_list ?? [],
        images:            [],
        tags:              r.tags ?? [],
        is_private:        r.is_private ?? false,
    }));

    const { error, count } = await supabase.from("recipes").insert(payload, { count: "exact" });
    if (error) return { error: error.message };

    revalidatePath("/dashboard/recipes");
    return { success: true, count: count ?? rows.length };
}

export async function moveRecipeToFolderAction(recipeId: string, folderId: string | null) {
    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };
    const { organizationId } = orgContext.context;

    const supabase = await createClient();

    if (folderId) {
        const { data: folder, error: folderError } = await supabase
            .from("recipe_folders")
            .select("id")
            .eq("id", folderId)
            .eq("organization_id", organizationId)
            .maybeSingle();

        if (folderError) return { error: folderError.message };
        if (!folder) return { error: "Dossier introuvable pour cette organisation" };
    }

    const { error } = await supabase
        .from("recipes")
        .update({ folder_id: folderId })
        .eq("id", recipeId)
        .eq("organization_id", organizationId);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/recipes");
    return { success: true };
}

export async function createFolderAction(organizationId: string, name: string, color: string) {
    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };
    const { organizationId: scopedOrganizationId } = orgContext.context;

    if (organizationId !== scopedOrganizationId) {
        return { error: "Organisation non autorisée" };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("recipe_folders")
        .insert({ organization_id: scopedOrganizationId, name: name.trim(), color })
        .select("id, name, color")
        .single();

    if (error) return { error: error.message };
    revalidatePath("/dashboard/recipes");
    return { success: true, folder: data };
}

export async function renameFolderAction(folderId: string, name: string) {
    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };
    const { organizationId } = orgContext.context;

    const supabase = await createClient();

    const { error } = await supabase
        .from("recipe_folders")
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq("id", folderId)
        .eq("organization_id", organizationId);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/recipes");
    return { success: true };
}

export async function deleteFolderAction(folderId: string) {
    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };
    const { organizationId } = orgContext.context;

    const supabase = await createClient();

    const { error } = await supabase
        .from("recipe_folders")
        .delete()
        .eq("id", folderId)
        .eq("organization_id", organizationId);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/recipes");
    return { success: true };
}

export async function saveTranscriptAction(recipeId: string, transcript: string, language: 'fr' | 'en') {
    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };
    const { organizationId } = orgContext.context;

    const supabase = await createClient();

    const { error } = await supabase
        .from("recipes")
        .update({ audio_transcript: transcript, audio_language: language })
        .eq("id", recipeId)
        .eq("organization_id", organizationId);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/recipes");
    return { success: true };
}

type RecipeMediaType = "image" | "audio";

function inferFileExtension(fileName: string, mimeType: string, mediaType: RecipeMediaType) {
    const fromName = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() : null;
    if (fromName) return fromName;

    const byMime: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "audio/mpeg": "mp3",
        "audio/mp4": "m4a",
        "audio/wav": "wav",
        "audio/webm": "webm",
        "audio/ogg": "ogg",
    };

    return byMime[mimeType] ?? (mediaType === "image" ? "jpg" : "webm");
}

export async function uploadRecipeMediaAction(formData: FormData) {
    const orgContext = await getRequiredOrganizationContext();
    if (!orgContext.ok) return { error: orgContext.error };
    const { organizationId } = orgContext.context;

    const mediaType = formData.get("mediaType");
    if (mediaType !== "image" && mediaType !== "audio") {
        return { error: "Type de media invalide." };
    }

    const file = formData.get("file");
    if (!file || typeof file === "string") {
        return { error: "Aucun fichier fourni." };
    }

    const mimeType = file.type || "";
    const isImage = mediaType === "image";

    if (isImage && !mimeType.startsWith("image/")) {
        return { error: "Le fichier image est invalide." };
    }
    if (!isImage && !mimeType.startsWith("audio/")) {
        return { error: "Le fichier audio est invalide." };
    }

    const maxSize = isImage ? 12 * 1024 * 1024 : 25 * 1024 * 1024;
    if (file.size > maxSize) {
        return {
            error: isImage
                ? "Image trop volumineuse (max 12MB)."
                : "Audio trop volumineux (max 25MB).",
        };
    }

    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const ext = inferFileExtension(file.name || "", mimeType, mediaType);
    const safeName = `${Date.now()}-${randomUUID()}.${ext}`;
    const path = `${organizationId}/${mediaType}/${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await admin.storage
        .from("recipes")
        .upload(path, buffer, {
            cacheControl: "3600",
            upsert: false,
            contentType: mimeType || undefined,
        });

    if (uploadError) {
        if (uploadError.message?.toLowerCase().includes("bucket")) {
            return { error: "Bucket de stockage 'recipes' introuvable. Appliquez les migrations Supabase." };
        }
        return { error: `Upload impossible: ${uploadError.message}` };
    }

    const {
        data: { publicUrl },
    } = admin.storage.from("recipes").getPublicUrl(path);

    return { success: true, url: publicUrl };
}
