import Link from "next/link";
import { ChefHat, ShoppingCart, Menu, Phone, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StorefrontHeader({ orgName }: { orgName: string }) {
    return (
        <header className="sticky top-0 w-full z-50 bg-background/95 backdrop-blur-md border-b border-primary/10 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group hover:opacity-80 transition-opacity">
                    <span className="material-icons text-primary text-3xl shrink-0">restaurant</span>
                    <span className="font-serif font-bold text-2xl tracking-tight text-foreground">
                        {orgName}<span className="text-primary">.</span>
                    </span>
                </Link>

                {/* Nav (Desktop) */}
                <nav className="hidden md:flex items-center space-x-8">
                    <Link href="#menu" className="text-foreground hover:text-primary font-medium transition-colors">
                        Notre Carte
                    </Link>
                    <Link href="#about" className="text-muted-foreground hover:text-primary font-medium transition-colors">
                        Notre Histoire
                    </Link>
                    <Link href="#contact" className="text-muted-foreground hover:text-primary font-medium transition-colors">
                        Événements
                    </Link>
                </nav>

                {/* Actions */}
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary transition-colors">
                        <ShoppingCart className="h-6 w-6" />
                        <span className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[1.25rem]">
                            0
                        </span>
                    </Button>
                    <Button variant="ghost" size="icon" className="md:hidden text-foreground">
                        <Menu className="h-6 w-6" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
