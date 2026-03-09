"use server";

import { auth } from "@clerk/nextjs/server";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function uploadComplaintFileAction(formData: FormData) {
    const { userId } = await auth();
    if (!userId) return { error: "Non authentifié" };

    const supabase = await createServerClient();
    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("clerk_id", userId)
        .single();
    if (!profile?.organization_id) return { error: "Organisation introuvable" };

    const file = formData.get("file") as File | null;
    if (!file) return { error: "Aucun fichier fourni." };

    const isImage = file.type.startsWith("image/");
    const isAudio = file.type.startsWith("audio/");
    if (!isImage && !isAudio) return { error: "Type de fichier non supporté." };
    if (file.size > 10 * 1024 * 1024) return { error: "Fichier trop volumineux (max 10MB)." };

    const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const timestamp = Date.now();
    const ext = file.name.split(".").pop() || (isImage ? "jpg" : "webm");
    const prefix = isImage ? "photo" : "audio";
    const path = `${profile.organization_id}/${prefix}_${timestamp}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error } = await admin.storage
        .from("complaints")
        .upload(path, buffer, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
        });

    if (error) {
        console.error("[uploadComplaintFile] error:", error);
        return { error: "Erreur lors de l'upload." };
    }

    const { data: { publicUrl } } = admin.storage
        .from("complaints")
        .getPublicUrl(path);

    return { success: true, url: publicUrl };
}

export async function createComplaintAction(data: {
    subject: string;
    description: string;
    photo_url?: string | null;
    audio_url?: string | null;
}) {
    const { userId } = await auth();
    if (!userId) return { error: "Non authentifié" };

    const supabase = await createServerClient();
    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("clerk_id", userId)
        .single();
    if (!profile?.organization_id) return { error: "Organisation introuvable" };

    if (!data.subject?.trim() || !data.description?.trim()) {
        return { error: "L'objet et la description sont requis." };
    }

    const { error } = await supabase.from("complaints").insert({
        organization_id: profile.organization_id,
        submitted_by: userId,
        subject: data.subject.trim(),
        description: data.description.trim(),
        photo_url: data.photo_url || null,
        audio_url: data.audio_url || null,
    });

    if (error) {
        console.error("[createComplaintAction] error:", error);
        return { error: "Erreur lors de la création du signalement." };
    }

    revalidatePath("/dashboard/support");
    return { success: true };
}
