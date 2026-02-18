"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Image as ImageIcon, Save, Loader2 } from "lucide-react";
import { ColorPickerField } from "@/components/dashboard/ColorPickerField";
import { BackButton } from "@/components/dashboard/BackButton";
import { ImageUpload } from "@/components/ImageUpload";
import { updateSettingsAction } from "@/actions/settings";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SettingsFormProps {
    org: any;
    settings: any;
}

export function SettingsForm({ org, settings }: SettingsFormProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        try {
            const result = await updateSettingsAction(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Paramètres mis à jour avec succès !");
                router.refresh();
            }
        } catch (error) {
            toast.error("Une erreur inattendue est survenue.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Need to handle onSubmit to prevent default and call action manually to support loading state/toast
    // OR use useTransition if using server action directly in action prop.
    // Here we use the onSubmit wrapper for simplicity with the modified action return type.

    return (
        <form action={handleSubmit} className="space-y-6">
            <input type="hidden" name="orgId" value={org.id} />

            {/* General Info */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Informations Générales</CardTitle>
                            <CardDescription>Ces informations sont visibles sur votre page d'accueil.</CardDescription>
                        </div>
                        {org.slug && (
                            <a
                                href={`/${org.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                            >
                                <Globe className="h-4 w-4" />
                                Voir mon site
                            </a>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom du Restaurant</Label>
                            <Input id="name" name="name" defaultValue={org.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Identifiant URL (Slug)</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-sm font-mono bg-muted/50 px-2 py-2 rounded-l-md border border-r-0">
                                    /
                                </span>
                                <Input
                                    id="slug"
                                    name="slug"
                                    defaultValue={org.slug || ""}
                                    placeholder="mon-restaurant"
                                    className="rounded-l-none font-mono"
                                    required
                                    pattern="[a-z0-9\-]+"
                                    title="Lettres minuscules, chiffres et tirets uniquement."
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                C'est l'adresse de votre site : {process.env.NEXT_PUBLIC_APP_URL || "restaurant-os.com"}/{org.slug || "votre-nom"}
                            </p>
                        </div>
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
                        <Label>Image de fond (Hero)</Label>
                        <ImageUpload
                            name="heroImage"
                            defaultValue={settings.hero_image}
                            folder={`organizations/${org.id}/settings`}
                        />
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
                        <Label htmlFor="heroSubtitle">Sous-titre (ex: Plat Signature)</Label>
                        <Input
                            id="heroSubtitle"
                            name="heroSubtitle"
                            defaultValue={settings.hero_subtitle || "Une expérience culinaire inoubliable pour vos événements."}
                        />
                    </div>

                    <div className="space-y-2 pt-4 border-t border-border">
                        <Label htmlFor="primaryColor">Couleur Thème (Principale)</Label>
                        <ColorPickerField defaultValue={settings.primary_color || "#f4af25"} />
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
                <BackButton />
                <Button type="submit" className="bg-primary hover:bg-primary/90 gap-2" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Enregistrer les modifications
                </Button>
            </div>
        </form>
    );
}
