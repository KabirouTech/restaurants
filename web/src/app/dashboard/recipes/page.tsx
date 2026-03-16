import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
// Button + Link kept for the header CTA
import { RecipesClient } from "./RecipesClient";
import { getTranslations } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export default async function RecipesPage() {
    const t = await getTranslations("dashboard.recipes");
    const { userId, profile } = await getCurrentProfile();
    if (!userId) redirect("/sign-in");

    const supabase = await createClient();
    if (!profile?.organization_id) redirect("/dashboard/onboarding");

    const [recipesRes, foldersRes] = await Promise.all([
        supabase
            .from("recipes")
            .select(`
                id, name, description, category, servings,
                prep_time_minutes, cook_time_minutes, images,
                audio_url, tags, is_private, folder_id,
                created_at, updated_at,
                products ( id, name, category )
            `)
            .eq("organization_id", profile.organization_id)
            .order("updated_at", { ascending: false }),
        supabase
            .from("recipe_folders")
            .select("id, name, color")
            .eq("organization_id", profile.organization_id)
            .order("created_at"),
    ]);

    const all = (recipesRes.data || []).map(r => ({
        ...r,
        products: Array.isArray(r.products) ? (r.products[0] ?? null) : (r.products ?? null),
    }));
    const folders = foldersRes.data || [];

    return (
        <div className="flex flex-col min-h-screen animate-in fade-in duration-500 pb-24">
            {/* Header sticky */}
            <div className="sticky top-0 z-40 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-border shadow-sm p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[1600px] mx-auto">
                    <div>
                        <div className="flex items-center gap-2 text-primary font-medium mb-1">
                            <BookOpen className="h-5 w-5" />
                            <span>{t('title')}</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold font-serif">
                            {t('myRecipes')}
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            {t('recipeCount', { count: all.length })} — {t('format')}
                        </p>
                    </div>
                    <Button asChild className="bg-primary text-white gap-2">
                        <Link href="/dashboard/recipes/new">
                            <Plus className="h-4 w-4" />
                            {t('newRecipe')}
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full">
                <RecipesClient recipes={all} folders={folders} orgId={profile.organization_id} />
            </div>
        </div>
    );
}
