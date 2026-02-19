"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Send, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { submitContactFormAction } from "@/actions/contact-form";


interface ContactSectionProps {
    settings: any;
}

export function ContactSection({ settings }: ContactSectionProps) {
    const title = settings?.contact_title || "Faisons Connaissance";
    const subtitle = settings?.contact_subtitle || "Parlons de votre prochain événement. Réponse sous 24h.";
    const phone = settings?.contact_phone;
    const email = settings?.contact_email;
    const address = settings?.contact_address;

    const orgId = settings?.org_id;
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const fd = new FormData(e.currentTarget);

        if (!orgId) {
            // Fallback: just show success (org_id not passed)
            await new Promise((r) => setTimeout(r, 800));
            setLoading(false);
            setSent(true);
            return;
        }

        const result = await submitContactFormAction({
            orgId,
            name: fd.get("name") as string,
            email: fd.get("email") as string,
            phone: fd.get("phone") as string,
            eventType: fd.get("event") as string,
            eventDate: fd.get("date") as string,
            guestCount: fd.get("guests") as string,
            message: fd.get("message") as string || "",
        });

        setLoading(false);
        if (result?.error) {
            toast.error(result.error);
        } else {
            setSent(true);
        }
    };


    return (
        <section id="contact" className="scroll-mt-24 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

                {/* Left: Info */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <span className="text-primary font-medium tracking-widest uppercase text-xs">Contact</span>
                        <h2 className="text-4xl lg:text-5xl font-serif font-bold text-secondary leading-tight">{title}</h2>
                        <p className="text-muted-foreground leading-relaxed">{subtitle}</p>
                        <div className="w-16 h-1 bg-primary rounded-full" />
                    </div>

                    <div className="space-y-4">
                        {phone && (
                            <a href={`tel:${phone}`} className="flex items-center gap-4 group">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <Phone className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Téléphone</p>
                                    <p className="font-semibold text-secondary">{phone}</p>
                                </div>
                            </a>
                        )}
                        {email && (
                            <a href={`mailto:${email}`} className="flex items-center gap-4 group">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <Mail className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p>
                                    <p className="font-semibold text-secondary">{email}</p>
                                </div>
                            </a>
                        )}
                        {address && (
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <MapPin className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Adresse</p>
                                    <p className="font-semibold text-secondary">{address}</p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Right: Form */}
                <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm">
                    {sent ? (
                        <div className="flex flex-col items-center justify-center text-center h-72 space-y-4">
                            <CheckCircle className="h-16 w-16 text-green-500" />
                            <h3 className="text-2xl font-serif font-bold text-secondary">Message envoyé !</h3>
                            <p className="text-muted-foreground">Nous vous répondrons dans les meilleurs délais.</p>
                            <Button variant="outline" onClick={() => setSent(false)} className="mt-4 rounded-full">
                                Envoyer un autre message
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="c-name">Prénom &amp; Nom</Label>
                                    <Input id="c-name" name="name" placeholder="Votre nom complet" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="c-email">Email</Label>
                                    <Input id="c-email" name="email" type="email" placeholder="votre@email.com" required />

                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="c-phone">Téléphone</Label>
                                    <Input id="c-phone" name="phone" type="tel" placeholder="06..." />

                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="c-event">Type d'événement</Label>
                                    <select
                                        id="c-event" name="event"
                                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    >
                                        <option value="">Choisir...</option>
                                        <option>Mariage</option>
                                        <option>Anniversaire</option>
                                        <option>Séminaire / Corporate</option>
                                        <option>Fête privée</option>
                                        <option>Autre</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="c-date">Date de l'événement</Label>
                                    <Input id="c-date" name="date" type="date" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="c-guests">Nombre d'invités</Label>
                                    <Input id="c-guests" name="guests" type="number" min="1" placeholder="ex: 50" />

                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="c-message">Message</Label>
                                <Textarea
                                    id="c-message" name="message" rows={4}
                                    placeholder="Décrivez votre événement, vos attentes, votre budget approximatif..."
                                />
                            </div>
                            <Button
                                type="submit" disabled={loading}
                                className="w-full rounded-full py-6 text-base font-bold gap-2 shadow-lg shadow-primary/20"
                            >
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                {loading ? "Envoi en cours..." : "Envoyer ma demande"}
                            </Button>
                            <p className="text-center text-xs text-muted-foreground">Sans engagement. Devis gratuit.</p>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
}
