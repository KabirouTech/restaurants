import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecipeForm } from "@/components/dashboard/recipes/RecipeForm";
import { getCurrentProfile } from "@/lib/auth/current-profile";

export default async function NewRecipePage() {
    const { userId, profile } = await getCurrentProfile();
    if (!userId) redirect("/sign-in");

    const supabase = await createClient();
    if (!profile?.organization_id) redirect("/dashboard/onboarding");

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
                            <span>Nouvelle recette</span>
                        </div>
                        <h1 className="text-2xl font-bold font-serif">Créer une recette</h1>
                    </div>
                </div>
            </div>
            <div className="p-6 md:p-8 max-w-[1600px] mx-auto w-full">
                <RecipeForm orgId={profile.organization_id} products={products || []} />
            </div>
        </div>
    );
}
