"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Globe, Save, Loader2, Eye, Palette, Store,
    Phone, Mail, MapPin, Instagram, Facebook, Twitter,
    Image as ImageIcon, Type, AlignLeft, Sparkles, ExternalLink
} from "lucide-react";
import { ColorPicker } from "@/components/ui/color-picker";
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
import { cn } from "@/lib/utils";

interface SettingsFormProps {
    org: any;
    settings: any;
}

// ─── Live Preview Mini ────────────────────────────────────────────────────────

function LivePreview({
    orgName, primaryColor, heroTitle, heroSubtitle, description, heroImage, logoUrl,
}: {
    orgName: string; primaryColor: string; heroTitle: string;
    heroSubtitle: string; description: string; heroImage?: string; logoUrl?: string;
}) {
    return (
        <div className="rounded-xl border border-border overflow-hidden shadow-lg text-[9px] select-none pointer-events-none">
            {/* Mini header */}
            <div className="bg-card border-b border-border/50 px-3 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                    {logoUrl
                        ? <img src={logoUrl} alt="" className="h-3 w-3 object-cover rounded-sm" />
                        : <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: primaryColor }} />
                    }
                    <span className="font-bold text-[8px] text-foreground">{orgName || "Mon Restaurant"}</span>
                </div>
                <div className="flex gap-2 text-muted-foreground">
                    <div className="w-5 h-1.5 rounded-full bg-muted" />
                    <div className="w-5 h-1.5 rounded-full bg-muted" />
                </div>
            </div>
            {/* Mini hero */}
            <div
                className="relative h-16 flex flex-col justify-end p-2"
                style={heroImage
                    ? { backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : { backgroundColor: "#1a1a2e" }
                }
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="relative z-10">
                    <span className="text-[6px] font-bold uppercase tracking-wider px-1 py-0.5 rounded-full text-white" style={{ backgroundColor: primaryColor }}>
                        {heroSubtitle || "Plat Signature"}
                    </span>
                    <p className="text-white font-bold mt-0.5 leading-tight" style={{ fontSize: "7px" }}>
                        {heroTitle || "L'Art de la Gastronomie"}
                    </p>
                </div>
            </div>
            {/* Mini content */}
            <div className="bg-muted px-2 py-1.5 space-y-1">
                <p className="text-muted-foreground leading-tight" style={{ fontSize: "6px" }}>
                    {description || "Votre description..."}
                </p>
                <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex-1 h-8 rounded bg-card border border-border" />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Section header ───────────────────────────────────────────────────────────

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

// ─── Main ─────────────────────────────────────────────────────────────────────

export function SettingsForm({ org, settings }: SettingsFormProps) {
    const [loading, startTransition] = useTransition();
    const router = useRouter();

    // Live state for preview
    const [orgName, setOrgName] = useState(org.name || "");
    const [primaryColor, setPrimaryColor] = useState(settings.primary_color || "#f4af25");
    const [heroTitle, setHeroTitle] = useState(settings.hero_title || "L'Art de la Gastronomie");
    const [heroSubtitle, setHeroSubtitle] = useState(settings.hero_subtitle || "Plat Signature");
    const [description, setDescription] = useState(settings.description || "");
    const [heroImage, setHeroImage] = useState(settings.hero_image || "");
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
                toast.success("Paramètres mis à jour !");
                router.refresh();
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <input type="hidden" name="orgId" value={org.id} />
            <input type="hidden" name="primaryColor" value={primaryColor} />
            <input type="hidden" name="logoUrl" value={logoUrl} />
            <input type="hidden" name="currency" value={currency} />

            {/* Two-column: form left, preview right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* ── LEFT: all cards ─────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* ── 1. Identity ────────────────────────────────── */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <SectionTitle icon={Store} title="Identité" desc="Nom, URL et logo de votre boutique." />

                            {/* Logo */}
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
                                    <SelectTrigger>
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
                        </CardContent>
                    </Card>

                    {/* ── 2. Apparence ───────────────────────────────── */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <SectionTitle icon={Palette} title="Apparence & Hero" desc="Couleurs, image de fond et textes de la bannière." />

                            {/* Primary color */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>Couleur principale</Label>
                                    <p className="text-xs text-muted-foreground mt-0.5">Utilisée pour les boutons, liens et badges.</p>
                                </div>
                                <ColorPicker value={primaryColor} onChange={setPrimaryColor} />
                            </div>

                            {/* Hero image */}
                            <div className="space-y-2">
                                <Label>Image Hero (bannière)</Label>
                                <ImageUpload
                                    name="heroImage"
                                    defaultValue={heroImage}
                                    folder={`organizations/${org.id}/settings`}
                                    onUpload={(url) => setHeroImage(url)}
                                />
                                <p className="text-xs text-muted-foreground">1920×1080px recommandé. Laissez vide pour l'image par défaut.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="heroTitle">Titre principal</Label>
                                    <Input
                                        id="heroTitle" name="heroTitle"
                                        value={heroTitle}
                                        onChange={(e) => setHeroTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="heroSubtitle">Badge / Accroche</Label>
                                    <Input
                                        id="heroSubtitle" name="heroSubtitle"
                                        value={heroSubtitle}
                                        onChange={(e) => setHeroSubtitle(e.target.value)}
                                        placeholder="Plat Signature"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── 3. Contact ──────────────────────────────────── */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <SectionTitle icon={Phone} title="Contact" desc="Visible sur le site et dans les devis." />
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

                    {/* ── 4. Réseaux sociaux ──────────────────────────── */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <SectionTitle icon={Globe} title="Réseaux Sociaux" desc="Liens affichés dans le footer de votre site." />
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

                    {/* ── 5. SEO ──────────────────────────────────────── */}
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <SectionTitle icon={Sparkles} title="SEO & Référencement" desc="Texte affiché dans les résultats de recherche Google." />
                            <div className="space-y-2">
                                <Label htmlFor="metaTitle">Titre SEO</Label>
                                <Input
                                    id="metaTitle" name="metaTitle"
                                    defaultValue={settings.meta_title || ""}
                                    placeholder={`${org.name} – Traiteur & Événementiel`}
                                    maxLength={60}
                                />
                                <p className="text-xs text-muted-foreground">Max 60 caractères.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="metaDescription">Description SEO</Label>
                                <Textarea
                                    id="metaDescription" name="metaDescription" rows={2}
                                    defaultValue={settings.meta_description || ""}
                                    placeholder="Commandez vos plateaux et buffets en ligne..."
                                    maxLength={160}
                                />
                                <p className="text-xs text-muted-foreground">Max 160 caractères.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── RIGHT: Live preview ─────────────────────────────── */}
                <div className="hidden lg:block sticky top-24 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Eye className="h-3.5 w-3.5" /> Aperçu en direct
                    </div>
                    <LivePreview
                        orgName={orgName}
                        primaryColor={primaryColor}
                        heroTitle={heroTitle}
                        heroSubtitle={heroSubtitle}
                        description={description}
                        heroImage={heroImage}
                        logoUrl={logoUrl}
                    />
                    <p className="text-[10px] text-muted-foreground text-center">Aperçu non contractuel</p>
                    {org.slug && (
                        <a
                            href={`/${org.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 text-xs text-primary font-medium hover:underline w-full"
                        >
                            <Globe className="h-3.5 w-3.5" /> Voir le vrai site
                        </a>
                    )}
                </div>
            </div>

            {/* Sticky save bar */}
            <div className="flex justify-end gap-4 sticky bottom-6 bg-background/80 backdrop-blur-sm p-4 border-t border-border rounded-xl shadow-lg">
                <Button type="submit" className="bg-primary hover:bg-primary/90 gap-2" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Enregistrer toutes les modifications
                </Button>
            </div>
        </form>
    );
}
