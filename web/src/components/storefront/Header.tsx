import Link from "next/link";
import { ChefHat, ShoppingCart, Menu, Phone, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StorefrontHeader({ orgName }: { orgName: string }) {
    return (
        <header className="sticky top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
                    <div className="bg-primary/10 p-1.5 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <ChefHat className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-serif font-bold text-xl text-secondary tracking-tight">
                        {orgName}
                    </span>
                </Link>

                {/* Nav (Desktop) */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="#about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:underline decoration-primary underline-offset-4">
                        À propos
                    </Link>
                    <Link href="#menu" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:underline decoration-primary underline-offset-4">
                        La Carte
                    </Link>
                    <Link href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hover:underline decoration-primary underline-offset-4">
                        Contact
                    </Link>
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                    </Button>
                    <Button size="sm" className="hidden md:flex gap-2 bg-secondary text-white hover:bg-secondary/90 shadow-md">
                        <Phone className="h-4 w-4" /> Réserver
                    </Button>
                    <Button size="sm" variant="outline" className="hidden md:flex gap-2">
                        <Instagram className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
