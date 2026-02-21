"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
    Store, Phone, Mail, MapPin, Instagram, Facebook, Twitter,
    Save, Loader2, Globe, ExternalLink
} from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/lib/currencies";
import { updateSettingsAction } from "@/actions/settings";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SettingsSavePortal } from "./SettingsSavePortal";

interface SettingsFormProps {
    org: any;
    settings: any;
}

// ─── Section header ───

function SectionTitle({ icon: Icon, title, desc }: { icon: any; title: string; desc?: string }) {
    return (
        <div className="flex items-start gap-3 pb-4 border-b border-border mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
                <p className="font-semibold text-sm text-foreground">{title}</p>
                {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
            </div>
        </div>
    );
}

// ─── Main ───

export function SettingsForm({ org, settings }: SettingsFormProps) {
    const [loading, startTransition] = useTransition();
    const router = useRouter();

    const [orgName, setOrgName] = useState(org.name || "");
    const [description, setDescription] = useState(settings.description || "");
    const [logoUrl, setLogoUrl] = useState(settings.logo_url || "");
    const [currency, setCurrency] = useState(settings.currency || "EUR");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            const result = await updateSettingsAction(formData);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Paramètres entreprise mis à jour !");
                router.refresh();
            }
        });
    };

    return (
        <form id="settings-general-form" onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
            {/* Hidden fields for properties managed here */}
            <input type="hidden" name="orgId" value={org.id} />
            <input type="hidden" name="logoUrl" value={logoUrl} />
            <input type="hidden" name="currency" value={currency} />

            {/* ── 1. Identity ── */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <SectionTitle icon={Store} title="Identité" desc="Nom, URL et logo de votre boutique." />

                    {/* Logo & Info */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Logo</Label>
                            <ImageUpload
                                name="logoUrl"
                                defaultValue={logoUrl}
                                folder={`organizations/${org.id}/logo`}
                                onUpload={(url) => setLogoUrl(url)}
                            />
                            <p className="text-xs text-muted-foreground">PNG transparent recommandé. Carré ~256×256px.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nom du restaurant</Label>
                                <Input
                                    id="name" name="name"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">URL publique (slug)</Label>
                                <div className="flex items-center">
                                    <span className="text-muted-foreground text-sm font-mono bg-muted/50 px-2 py-2 rounded-l-md border border-r-0 border-border shrink-0">/</span>
                                    <Input
                                        id="slug" name="slug"
                                        defaultValue={org.slug || ""}
                                        placeholder="mon-restaurant"
                                        className="rounded-l-none font-mono"
                                        required
                                        pattern="[a-z0-9\-]+"
                                    />
                                </div>
                                {org.slug && (
                                    <a href={`/${org.slug}`} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                        <ExternalLink className="h-3 w-3" /> Voir mon site →
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description / Slogan</Label>
                            <Textarea
                                id="description" name="description" rows={2}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="La meilleure cuisine de la ville..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Devise</Label>
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger className="w-full md:max-w-xs">
                                    <SelectValue placeholder="Sélectionnez une devise" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CURRENCIES.map((c) => (
                                        <SelectItem key={c.code} value={c.code}>
                                            {c.label} ({c.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">La devise affichée sur votre menu et vos devis.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── 2. Contact ── */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <SectionTitle icon={Phone} title="Contact" desc="Visible sur le site et dans vos correspondances." />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone"><Phone className="inline h-3 w-3 mr-1" />Téléphone</Label>
                            <Input id="phone" name="phone" defaultValue={settings.contact_phone || ""} placeholder="+33 6 ..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email"><Mail className="inline h-3 w-3 mr-1" />Email public</Label>
                            <Input id="email" name="email" type="email" defaultValue={settings.contact_email || ""} placeholder="contact@restaurant.com" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address"><MapPin className="inline h-3 w-3 mr-1" />Adresse</Label>
                        <Input id="address" name="address" defaultValue={settings.contact_address || ""} placeholder="123 Rue de la Paix, Paris" />
                    </div>
                </CardContent>
            </Card>

            {/* ── 3. Réseaux sociaux ── */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <SectionTitle icon={Globe} title="Réseaux Sociaux" desc="Liens affichés dans le footer de votre vitrine." />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="instagram"><Instagram className="inline h-3 w-3 mr-1" />Instagram</Label>
                            <Input id="instagram" name="instagram" defaultValue={settings.social_instagram || ""} placeholder="https://instagram.com/..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="facebook"><Facebook className="inline h-3 w-3 mr-1" />Facebook</Label>
                            <Input id="facebook" name="facebook" defaultValue={settings.social_facebook || ""} placeholder="https://facebook.com/..." />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="twitter"><Twitter className="inline h-3 w-3 mr-1" />X / Twitter</Label>
                            <Input id="twitter" name="twitter" defaultValue={settings.social_twitter || ""} placeholder="https://x.com/..." />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Portal Save Button (Desktop) */}
            <SettingsSavePortal>
                <Button type="submit" form="settings-general-form" size="lg" className="bg-primary hover:bg-primary/90 gap-2 shadow-sm rounded-lg hidden md:flex px-8" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Enregistrer les paramètres
                </Button>
            </SettingsSavePortal>

            {/* Mobile Fallback Save */}
            <div className="flex justify-end md:hidden sticky bottom-6 bg-background/80 backdrop-blur-sm p-4 border-t border-border rounded-xl shadow-lg mt-8 w-full z-10">
                <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 gap-2 w-full rounded-lg" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Enregistrer les paramètres
                </Button>
            </div>
        </form>
    );
}
