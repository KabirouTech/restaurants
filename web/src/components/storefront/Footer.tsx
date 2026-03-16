import { Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { cn } from "@/lib/utils";
import type { StorefrontTemplate } from "@/lib/storefront-templates";

export function StorefrontFooter({
    orgName,
    settings,
    template = "classic",
}: {
    orgName: string;
    settings?: any;
    template?: StorefrontTemplate;
}) {
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
        <footer
            id="footer"
            className={cn(
                "py-16",
                template === "classic" && "bg-secondary text-secondary-foreground",
                template === "bistro" && "bg-zinc-950 text-zinc-100",
                template === "catering" && "bg-slate-900 text-slate-100",
                template === "restaurant" && "bg-rose-950 text-rose-50",
                template === "foodiedash" && "bg-[#f8f7f5] text-zinc-800",
                template === "elite" && "bg-[#1c1410] text-zinc-100 border-t border-white/5",
                template === "aromabrew" && "bg-slate-900/50 text-zinc-100 border-t border-yellow-500/10",
                template === "culina" && "bg-[#10221d] text-zinc-100 border-t border-slate-800"
            )}
        >

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Culina: minimal centered layout */}
                {template === "culina" ? (
                    <div className="flex flex-col items-center text-center space-y-8">
                        <div className="flex items-center gap-2.5">
                            <LogoMark size="sm" />
                            <h3 className="font-sans text-2xl font-extrabold text-emerald-400">{orgName}</h3>
                        </div>
                        <p className="text-sm text-zinc-400 max-w-md leading-relaxed">{description}</p>
                        <nav className="flex flex-wrap justify-center gap-6 text-sm">
                            <a href="#menu" className="text-zinc-400 hover:text-emerald-400 transition-colors">Notre Carte</a>
                            <a href="#about" className="text-zinc-400 hover:text-emerald-400 transition-colors">À propos</a>
                            <a href="#contact" className="text-zinc-400 hover:text-emerald-400 transition-colors">Contact</a>
                        </nav>
                        {hasSocial && (
                            <div className="flex gap-3">
                                {instagram && (
                                    <a href={instagram} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-emerald-400/20 text-zinc-400 hover:text-emerald-400 transition-colors">
                                        <Instagram className="h-4 w-4" />
                                    </a>
                                )}
                                {facebook && (
                                    <a href={facebook} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-emerald-400/20 text-zinc-400 hover:text-emerald-400 transition-colors">
                                        <Facebook className="h-4 w-4" />
                                    </a>
                                )}
                                {twitter && (
                                    <a href={twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-white/5 hover:bg-emerald-400/20 text-zinc-400 hover:text-emerald-400 transition-colors">
                                        <Twitter className="h-4 w-4" />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    /* All other templates: grid layout */
                    <div className={cn(
                        "grid gap-12 mb-12",
                        (template === "foodiedash" || template === "aromabrew") ? "grid-cols-1 md:grid-cols-4" : "grid-cols-1 md:grid-cols-3"
                    )}>

                        {/* Brand */}
                        <div className={cn(
                            "space-y-4",
                            (template === "foodiedash" || template === "aromabrew") && "md:col-span-2"
                        )}>
                            <div className="flex items-center gap-2.5">
                                <LogoMark size="sm" />
                                <h3 className={cn(
                                    "font-serif text-2xl font-bold",
                                    template === "elite" && "italic uppercase tracking-widest text-xl"
                                )}>{orgName}</h3>
                            </div>
                            <p className="text-sm opacity-80 leading-relaxed">{description}</p>
                            {hasSocial && (
                                <div className="flex gap-3 pt-2">
                                    {instagram && (
                                        <a href={instagram} target="_blank" rel="noopener noreferrer"
                                            className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                template === "catering"
                                                    ? "bg-slate-800 hover:bg-primary/80"
                                                    : template === "foodiedash"
                                                        ? "bg-[#f27f0d]/10 text-[#f27f0d] rounded-full hover:bg-[#f27f0d] hover:text-white"
                                                        : template === "elite"
                                                            ? "bg-white/5 hover:bg-primary/80"
                                                            : template === "aromabrew"
                                                                ? "bg-white/5 hover:bg-[#f4c025]/80 hover:text-zinc-900"
                                                                : "bg-white/10 hover:bg-primary/80"
                                            )}>
                                            <Instagram className="h-4 w-4" />
                                        </a>
                                    )}
                                    {facebook && (
                                        <a href={facebook} target="_blank" rel="noopener noreferrer"
                                            className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                template === "catering"
                                                    ? "bg-slate-800 hover:bg-primary/80"
                                                    : template === "foodiedash"
                                                        ? "bg-[#f27f0d]/10 text-[#f27f0d] rounded-full hover:bg-[#f27f0d] hover:text-white"
                                                        : template === "elite"
                                                            ? "bg-white/5 hover:bg-primary/80"
                                                            : template === "aromabrew"
                                                                ? "bg-white/5 hover:bg-[#f4c025]/80 hover:text-zinc-900"
                                                                : "bg-white/10 hover:bg-primary/80"
                                            )}>
                                            <Facebook className="h-4 w-4" />
                                        </a>
                                    )}
                                    {twitter && (
                                        <a href={twitter} target="_blank" rel="noopener noreferrer"
                                            className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                template === "catering"
                                                    ? "bg-slate-800 hover:bg-primary/80"
                                                    : template === "foodiedash"
                                                        ? "bg-[#f27f0d]/10 text-[#f27f0d] rounded-full hover:bg-[#f27f0d] hover:text-white"
                                                        : template === "elite"
                                                            ? "bg-white/5 hover:bg-primary/80"
                                                            : template === "aromabrew"
                                                                ? "bg-white/5 hover:bg-[#f4c025]/80 hover:text-zinc-900"
                                                                : "bg-white/10 hover:bg-primary/80"
                                            )}>
                                            <Twitter className="h-4 w-4" />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Contact */}
                        {hasContact && (
                            <div className="space-y-4">
                                <h4 className={cn(
                                    "font-semibold uppercase tracking-wider text-xs",
                                    template === "elite" ? "tracking-widest text-zinc-500" : "opacity-60"
                                )}>Nous contacter</h4>
                                <ul className="space-y-3 text-sm opacity-90">
                                    {phone && (
                                        <li className="flex items-center gap-2">
                                            <Phone className={cn(
                                                "h-4 w-4 shrink-0",
                                                template === "foodiedash" ? "text-[#f27f0d]" :
                                                template === "elite" ? "text-primary" :
                                                template === "aromabrew" ? "text-[#f4c025]" :
                                                "text-primary"
                                            )} />
                                            <a href={`tel:${phone}`} className={cn(
                                                "transition-colors",
                                                template === "foodiedash" ? "hover:text-[#f27f0d]" :
                                                template === "aromabrew" ? "hover:text-[#f4c025]" :
                                                "hover:text-primary"
                                            )}>{phone}</a>
                                        </li>
                                    )}
                                    {email && (
                                        <li className="flex items-center gap-2">
                                            <Mail className={cn(
                                                "h-4 w-4 shrink-0",
                                                template === "foodiedash" ? "text-[#f27f0d]" :
                                                template === "elite" ? "text-primary" :
                                                template === "aromabrew" ? "text-[#f4c025]" :
                                                "text-primary"
                                            )} />
                                            <a href={`mailto:${email}`} className={cn(
                                                "transition-colors",
                                                template === "foodiedash" ? "hover:text-[#f27f0d]" :
                                                template === "aromabrew" ? "hover:text-[#f4c025]" :
                                                "hover:text-primary"
                                            )}>{email}</a>
                                        </li>
                                    )}
                                    {address && (
                                        <li className="flex items-start gap-2">
                                            <MapPin className={cn(
                                                "h-4 w-4 shrink-0 mt-0.5",
                                                template === "foodiedash" ? "text-[#f27f0d]" :
                                                template === "elite" ? "text-primary" :
                                                template === "aromabrew" ? "text-[#f4c025]" :
                                                "text-primary"
                                            )} />
                                            <span>{address}</span>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}

                        {/* Links */}
                        <div className="space-y-4">
                            <h4 className={cn(
                                "font-semibold uppercase tracking-wider text-xs opacity-60",
                                template === "elite" && "tracking-widest"
                            )}>Navigation</h4>
                            <ul className="space-y-2.5 text-sm opacity-80">
                                <li><a href="#menu" className={cn(
                                    "transition-colors",
                                    template === "foodiedash" ? "hover:text-[#f27f0d]" :
                                    template === "aromabrew" ? "hover:text-[#f4c025]" :
                                    "hover:text-primary"
                                )}>Notre Carte</a></li>
                                <li><a href="#about" className={cn(
                                    "transition-colors",
                                    template === "foodiedash" ? "hover:text-[#f27f0d]" :
                                    template === "aromabrew" ? "hover:text-[#f4c025]" :
                                    "hover:text-primary"
                                )}>À propos</a></li>
                                <li><a href="#contact" className={cn(
                                    "transition-colors",
                                    template === "foodiedash" ? "hover:text-[#f27f0d]" :
                                    template === "aromabrew" ? "hover:text-[#f4c025]" :
                                    "hover:text-primary"
                                )}>Événements & Contact</a></li>
                            </ul>
                        </div>

                        {/* foodiedash: extra column for app download / info */}
                        {template === "foodiedash" && (
                            <div className="space-y-4">
                                <h4 className="font-semibold uppercase tracking-wider text-xs opacity-60">Informations</h4>
                                <ul className="space-y-2.5 text-sm opacity-80">
                                    <li><a href="#menu" className="hover:text-[#f27f0d] transition-colors">Commander</a></li>
                                    <li><a href="#about" className="hover:text-[#f27f0d] transition-colors">Livraison</a></li>
                                    <li><a href="#contact" className="hover:text-[#f27f0d] transition-colors">Aide</a></li>
                                </ul>
                            </div>
                        )}

                        {/* aromabrew: newsletter section */}
                        {template === "aromabrew" && (
                            <div className="space-y-4">
                                <h4 className="font-semibold uppercase tracking-wider text-xs opacity-60">Newsletter</h4>
                                <p className="text-sm opacity-70">Recevez nos offres et nouveautés.</p>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        placeholder="Votre email..."
                                        className="flex-1 bg-white/10 border border-yellow-500/20 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-[#f4c025]/50 transition-colors"
                                    />
                                    <button className="bg-[#f4c025] text-zinc-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#e5b320] transition-colors whitespace-nowrap">
                                        S&apos;abonner
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className={cn(
                    "pt-8 border-t flex flex-col md:flex-row justify-between items-center text-xs gap-4",
                    template === "foodiedash" ? "border-zinc-200 text-zinc-500" :
                    template === "catering" ? "border-slate-700 opacity-50" :
                    template === "elite" ? "border-white/5 opacity-50" :
                    template === "aromabrew" ? "border-yellow-500/10 opacity-50" :
                    template === "culina" ? "border-slate-800 mt-8 opacity-50" :
                    "border-white/10 opacity-50"
                )}>
                    <p>&copy; {new Date().getFullYear()} {orgName}. Tous droits réservés.</p>
                    <p className="flex items-center gap-1.5">
                        Propulsé par
                        <Link href="/" className={cn(
                            "inline-flex items-center gap-1.5 font-bold hover:underline ml-1",
                            template === "foodiedash" ? "text-[#f27f0d]" :
                            template === "aromabrew" ? "text-[#f4c025]" :
                            template === "culina" ? "text-emerald-400" :
                            "text-primary"
                        )}>
                            <LogoMark size="sm" />
                            Restaurant<span>OS</span>
                        </Link>
                    </p>

                </div>
            </div>
        </footer>
    );
}
