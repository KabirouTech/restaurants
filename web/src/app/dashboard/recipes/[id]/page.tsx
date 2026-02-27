import { createClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipeForm } from "@/components/dashboard/recipes/RecipeForm";

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();
    if (!profile?.organization_id) redirect("/dashboard/onboarding");

    const { data: recipe } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", id)
        .eq("organization_id", profile.organization_id)
        .single();

    if (!recipe) notFound();

    const { data: products } = await supabase
        .from("products")
        .select("id, name, category")
        .eq("organization_id", profile.organization_id)
        .eq("is_active", true)
        .order("name");

    return (
        <div className="flex flex-col min-h-screen pb-24">
            <div className="sticky top-0 z-40 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-border shadow-sm p-6 md:p-8">
                <div className="flex items-center gap-4 max-w-[1600px] mx-auto">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/dashboard/recipes"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 text-primary font-medium mb-1">
                            <BookOpen className="h-5 w-5" />
                            <span>Modifier la recette</span>
                        </div>
                        <h1 className="text-2xl font-bold font-serif truncate">{recipe.name}</h1>
                    </div>
                </div>
            </div>
            <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full">
                <RecipeForm
                    orgId={profile.organization_id}
                    products={products || []}
                    initialData={{
                        id:                  recipe.id,
                        name:                recipe.name,
                        description:         recipe.description,
                        category:            recipe.category,
                        servings:            recipe.servings,
                        prep_time_minutes:   recipe.prep_time_minutes,
                        cook_time_minutes:   recipe.cook_time_minutes,
                        instructions:        recipe.instructions,
                        ingredients_list:    recipe.ingredients_list || [],
                        images:              recipe.images || [],
                        audio_url:           recipe.audio_url,
                        audio_transcript:    recipe.audio_transcript,
                        audio_language:      recipe.audio_language,
                        tags:                recipe.tags || [],
                        is_private:          recipe.is_private,
                        product_id:          recipe.product_id,
                    }}
                />
            </div>
        </div>
    );
}
