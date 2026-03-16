import { ChefHat, BarChart3, MessageSquare, ShoppingBag, Users, Star } from "lucide-react";

const FEATURES = [
    {
        icon: ShoppingBag,
        title: "Commandes",
        desc: "Recevez et gérez vos commandes en temps réel",
    },
    {
        icon: MessageSquare,
        title: "Messagerie unifiée",
        desc: "WhatsApp, Instagram, Email en un seul endroit",
    },
    {
        icon: BarChart3,
        title: "Tableau de bord",
        desc: "Statistiques et suivi de performance",
    },
    {
        icon: Users,
        title: "Gestion d'équipe",
        desc: "Invitez et gérez vos collaborateurs",
    },
];

const TESTIMONIAL = {
    text: "RestaurantOS a transformé notre façon de travailler. On gère tout depuis une seule plateforme.",
    name: "Aïssatou D.",
    role: "Traiteur, Dakar",
};

export function AuthSidePanel({ mode }: { mode: "sign-in" | "sign-up" }) {
    return (
        <div className="hidden lg:flex lg:w-[480px] xl:w-[520px] relative overflow-hidden flex-col justify-between bg-gradient-to-br from-amber-600 via-orange-600 to-red-600">
            {/* Background decorative elements */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Floating circles */}
                <div className="absolute top-[10%] left-[8%] w-64 h-64 rounded-full bg-white/[0.06] blur-sm" />
                <div className="absolute bottom-[15%] right-[-5%] w-80 h-80 rounded-full bg-white/[0.04]" />
                <div className="absolute top-[55%] left-[-10%] w-48 h-48 rounded-full bg-black/[0.08]" />

                {/* Grid pattern overlay */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-between h-full px-10 py-12">
                {/* Top: Logo + tagline */}
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <ChefHat className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-white text-xl font-bold tracking-tight">
                            RestaurantOS
                        </span>
                    </div>
                    <p className="text-white/60 text-sm mt-1 ml-[52px]">
                        La Teranga Digitale
                    </p>
                </div>

                {/* Middle: Hero text + features */}
                <div className="space-y-10">
                    <div>
                        <h1 className="text-white text-3xl xl:text-[2.1rem] font-bold leading-tight tracking-tight">
                            {mode === "sign-in"
                                ? "Content de vous revoir !"
                                : "Lancez votre restaurant en ligne"
                            }
                        </h1>
                        <p className="text-white/70 text-base mt-3 leading-relaxed max-w-sm">
                            {mode === "sign-in"
                                ? "Connectez-vous pour retrouver votre tableau de bord et gérer votre activité."
                                : "Créez votre espace en quelques minutes. Menu, commandes, clients — tout est inclus."
                            }
                        </p>
                    </div>

                    {/* Feature pills */}
                    <div className="grid grid-cols-2 gap-3">
                        {FEATURES.map((f) => (
                            <div
                                key={f.title}
                                className="group flex items-start gap-3 rounded-xl bg-white/[0.08] backdrop-blur-sm border border-white/[0.08] px-4 py-3.5 hover:bg-white/[0.12] transition-colors"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-white/20 transition-colors">
                                    <f.icon className="h-4 w-4 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-white text-sm font-semibold leading-tight">{f.title}</p>
                                    <p className="text-white/50 text-xs mt-0.5 leading-snug">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom: Testimonial */}
                <div className="space-y-5">
                    <div className="rounded-2xl bg-black/15 backdrop-blur-sm border border-white/[0.06] p-5">
                        <div className="flex gap-0.5 mb-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                            ))}
                        </div>
                        <p className="text-white/90 text-sm leading-relaxed italic">
                            &ldquo;{TESTIMONIAL.text}&rdquo;
                        </p>
                        <div className="flex items-center gap-3 mt-4">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                                {TESTIMONIAL.name[0]}
                            </div>
                            <div>
                                <p className="text-white text-sm font-medium">{TESTIMONIAL.name}</p>
                                <p className="text-white/50 text-xs">{TESTIMONIAL.role}</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats bar */}
                    <div className="flex items-center justify-between text-center px-2">
                        <div>
                            <p className="text-white text-lg font-bold">500+</p>
                            <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium">Restaurants</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <p className="text-white text-lg font-bold">15K+</p>
                            <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium">Commandes/mois</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div>
                            <p className="text-white text-lg font-bold">98%</p>
                            <p className="text-white/40 text-[10px] uppercase tracking-wider font-medium">Satisfaction</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
