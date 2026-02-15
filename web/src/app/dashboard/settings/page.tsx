import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, Globe, Image as ImageIcon, Save, Store } from "lucide-react";
import { updateSettingsAction } from "@/actions/settings";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login");

    const { data: profile } = await supabase
        .from("profiles")
        .select("*, organizations(*)")
        .eq("id", user.id)
        .single();

    if (!profile?.organization_id) redirect("/dashboard/onboarding");

    const org = profile.organizations;
    const settings = org.settings || {};

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-8 max-w-5xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-border pb-6">
                <div className="flex items-center gap-2 text-primary font-medium mb-1">
                    <Store className="h-5 w-5" />
                    <span>Configuration</span>
                </div>
                <h1 className="text-3xl font-bold font-serif text-secondary">
                    Paramètres de la Boutique
                </h1>
                <p className="text-muted-foreground">
                    Personnalisez l'apparence et les informations de votre storefront.
                </p>
            </div>

            <form action={updateSettingsAction} className="space-y-6">
                <input type="hidden" name="orgId" value={org.id} />

                {/* General Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informations Générales</CardTitle>
                        <CardDescription>Ces informations sont visibles sur votre page d'accueil.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom du Restaurant</Label>
                            <Input id="name" name="name" defaultValue={org.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Slogan)</Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={settings.description || ""}
                                placeholder="La meilleure cuisine de la ville..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Hero Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Apparence (Hero)</CardTitle>
                        <CardDescription>Personnalisez la grande image en haut de votre site.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="heroImage">URL de l'image de fond</Label>
                            <div className="flex gap-2">
                                <ImageIcon className="h-10 w-10 text-muted-foreground opacity-50" />
                                <Input
                                    id="heroImage"
                                    name="heroImage"
                                    defaultValue={settings.hero_image || ""}
                                    placeholder="https://images.unsplash.com/..."
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Recommandé : 1920x1080px. Laissez vide pour l'image par défaut.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="heroTitle">Titre Principal</Label>
                            <Input
                                id="heroTitle"
                                name="heroTitle"
                                defaultValue={settings.hero_title || "L'Art de la Gastronomie"}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="heroSubtitle">Sous-titre</Label>
                            <Input
                                id="heroSubtitle"
                                name="heroSubtitle"
                                defaultValue={settings.hero_subtitle || "Une expérience culinaire inoubliable pour vos événements."}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Contact</CardTitle>
                        <CardDescription>Comment vos clients peuvent-ils vous joindre ?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Téléphone</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    defaultValue={settings.contact_phone || ""}
                                    placeholder="+33 6 ..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Public</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={settings.contact_email || ""}
                                    placeholder="contact@restaurant.com"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Adresse</Label>
                            <Input
                                id="address"
                                name="address"
                                defaultValue={settings.contact_address || ""}
                                placeholder="123 Rue de la Paix, Paris"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4 sticky bottom-6 bg-background/80 backdrop-blur-sm p-4 border-t border-border rounded-lg shadow-lg">
                    <Button type="button" variant="outline" onClick={() => window.history.back()}>Annuler</Button>
                    <Button type="submit" className="bg-primary hover:bg-primary/90 gap-2">
                        <Save className="h-4 w-4" /> Enregistrer les modifications
                    </Button>
                </div>
            </form>
        </div>
    );
}
