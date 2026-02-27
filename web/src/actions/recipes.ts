"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type RecipeUpsertInput = {
    id?: string;
    organizationId: string;
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const payload = {
        organization_id:    input.organizationId,
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
            .select("id")
            .single();
    } else {
        result = await supabase
            .from("recipes")
            .insert(payload)
            .select("id")
            .single();
    }

    if (result.error) return { error: result.error.message };

    revalidatePath("/dashboard/recipes");
    return { success: true, id: result.data.id };
}

export async function deleteRecipeAction(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const { error } = await supabase.from("recipes").delete().eq("id", id);
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const payload = rows.map(r => ({
        organization_id:   organizationId,
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const { error } = await supabase
        .from("recipes")
        .update({ folder_id: folderId })
        .eq("id", recipeId);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/recipes");
    return { success: true };
}

export async function createFolderAction(organizationId: string, name: string, color: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const { data, error } = await supabase
        .from("recipe_folders")
        .insert({ organization_id: organizationId, name: name.trim(), color })
        .select("id, name, color")
        .single();

    if (error) return { error: error.message };
    revalidatePath("/dashboard/recipes");
    return { success: true, folder: data };
}

export async function renameFolderAction(folderId: string, name: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const { error } = await supabase
        .from("recipe_folders")
        .update({ name: name.trim(), updated_at: new Date().toISOString() })
        .eq("id", folderId);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/recipes");
    return { success: true };
}

export async function deleteFolderAction(folderId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const { error } = await supabase
        .from("recipe_folders")
        .delete()
        .eq("id", folderId);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/recipes");
    return { success: true };
}

export async function saveTranscriptAction(recipeId: string, transcript: string, language: 'fr' | 'en') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Non authentifié" };

    const { error } = await supabase
        .from("recipes")
        .update({ audio_transcript: transcript, audio_language: language })
        .eq("id", recipeId);

    if (error) return { error: error.message };
    revalidatePath("/dashboard/recipes");
    return { success: true };
}
