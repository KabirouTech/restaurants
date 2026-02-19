import { Mail, Phone, MapPin, Instagram, Facebook, Twitter, ChefHat } from "lucide-react";
import Link from "next/link";

export function StorefrontFooter({ orgName, settings }: { orgName: string; settings?: any }) {
    const description = settings?.description || "Célébrez vos moments importants avec une cuisine faite maison.";
    const email = settings?.contact_email;
    const phone = settings?.contact_phone;
    const address = settings?.contact_address;
    const instagram = settings?.social_instagram;
    const facebook = settings?.social_facebook;
    const twitter = settings?.social_twitter;
    const hasSocial = instagram || facebook || twitter;
    const hasContact = email || phone || address;

    return (
        <footer id="footer" className="bg-secondary text-secondary-foreground py-16">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">

                    {/* Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <ChefHat className="h-6 w-6 text-primary" />
                            <h3 className="font-serif text-2xl font-bold">{orgName}</h3>
                        </div>
                        <p className="text-sm opacity-80 leading-relaxed">{description}</p>
                        {hasSocial && (
                            <div className="flex gap-3 pt-2">
                                {instagram && (
                                    <a href={instagram} target="_blank" rel="noopener noreferrer"
                                        className="p-2 rounded-lg bg-white/10 hover:bg-primary/80 transition-colors">
                                        <Instagram className="h-4 w-4" />
                                    </a>
                                )}
                                {facebook && (
                                    <a href={facebook} target="_blank" rel="noopener noreferrer"
                                        className="p-2 rounded-lg bg-white/10 hover:bg-primary/80 transition-colors">
                                        <Facebook className="h-4 w-4" />
                                    </a>
                                )}
                                {twitter && (
                                    <a href={twitter} target="_blank" rel="noopener noreferrer"
                                        className="p-2 rounded-lg bg-white/10 hover:bg-primary/80 transition-colors">
                                        <Twitter className="h-4 w-4" />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Contact */}
                    {hasContact && (
                        <div className="space-y-4">
                            <h4 className="font-semibold uppercase tracking-wider text-xs opacity-60">Nous contacter</h4>
                            <ul className="space-y-3 text-sm opacity-90">
                                {phone && (
                                    <li className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 shrink-0 text-primary" />
                                        <a href={`tel:${phone}`} className="hover:text-primary transition-colors">{phone}</a>
                                    </li>
                                )}
                                {email && (
                                    <li className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 shrink-0 text-primary" />
                                        <a href={`mailto:${email}`} className="hover:text-primary transition-colors">{email}</a>
                                    </li>
                                )}
                                {address && (
                                    <li className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                                        <span>{address}</span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Links */}
                    <div className="space-y-4">
                        <h4 className="font-semibold uppercase tracking-wider text-xs opacity-60">Navigation</h4>
                        <ul className="space-y-2.5 text-sm opacity-80">
                            <li><a href="#menu" className="hover:text-primary transition-colors">Notre Carte</a></li>
                            <li><a href="#about" className="hover:text-primary transition-colors">À propos</a></li>
                            <li><a href="#contact" className="hover:text-primary transition-colors">Événements & Contact</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs opacity-50 gap-4">
                    <p>&copy; {new Date().getFullYear()} {orgName}. Tous droits réservés.</p>
                    <p className="flex items-center gap-1">
                        Propulsé par <Link href="/" className="font-bold text-primary ml-1 hover:underline">Restaurant OS</Link>
                    </p>

                </div>
            </div>
        </footer>
    );
}
