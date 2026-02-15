import { Mail, Phone, MapPin } from "lucide-react";

export function StorefrontFooter({ orgName, settings }: { orgName: string, settings?: any }) {
    const description = settings?.description || "Célébrez les moments importants avec une cuisine faite maison, inspirée par la tradition et l'innovation.";
    const email = settings?.contact_email;
    const phone = settings?.contact_phone;
    const address = settings?.contact_address;

    return (
        <footer className="bg-secondary text-secondary-foreground py-16 dark:bg-card dark:text-card-foreground">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="md:flex md:justify-between md:items-start text-center md:text-left">

                    {/* Brand & Description */}
                    <div className="space-y-4 max-w-sm mx-auto md:mx-0 mb-8 md:mb-0">
                        <h3 className="font-serif text-2xl font-bold tracking-tight">{orgName}</h3>
                        <p className="text-sm opacity-80 leading-relaxed text-balance">
                            {description}
                        </p>
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-col md:flex-row gap-8 md:gap-16 text-sm">
                        {(email || phone || address) && (
                            <div className="space-y-3">
                                <h4 className="font-semibold uppercase tracking-wider text-xs opacity-60">Contact</h4>
                                <ul className="space-y-3 opacity-90">
                                    {phone && (
                                        <li className="flex items-center gap-2 justify-center md:justify-start">
                                            <Phone className="h-4 w-4 shrink-0" />
                                            <a href={`tel:${phone}`} className="hover:text-primary transition-colors">{phone}</a>
                                        </li>
                                    )}
                                    {email && (
                                        <li className="flex items-center gap-2 justify-center md:justify-start">
                                            <Mail className="h-4 w-4 shrink-0" />
                                            <a href={`mailto:${email}`} className="hover:text-primary transition-colors">{email}</a>
                                        </li>
                                    )}
                                    {address && (
                                        <li className="flex items-start gap-2 justify-center md:justify-start">
                                            <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                                            <span>{address}</span>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}

                        <div className="space-y-3">
                            <h4 className="font-semibold uppercase tracking-wider text-xs opacity-60">Liens</h4>
                            <ul className="space-y-2 opacity-80">
                                <li><a href="#menu" className="hover:text-primary transition-colors">Menu</a></li>
                                <li><a href="#about" className="hover:text-primary transition-colors">À propos</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs opacity-60 gap-4">
                    <p>&copy; {new Date().getFullYear()} {orgName}. Tous droits réservés.</p>
                    <p className="flex items-center gap-1">Propulsé par <span className="font-bold text-primary">Restaurant OS</span></p>
                </div>
            </div>
        </footer>
    );
}
