"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface Product {
    id: string;
    name: string;
    description: string | null;
    price_cents: number;
    image_url: string | null;
    category: string;
}

export function MenuSection({ products }: { products: Product[] }) {
    // 1. Group by category
    const categories = Array.from(new Set(products.map(p => p.category))).sort();
    const [activeCategory, setActiveCategory] = useState<string>("Tous");
    const { addItem } = useCart();

    const filteredProducts = activeCategory === "Tous"
        ? products
        : products.filter(p => p.category === activeCategory);

    return (
        <section id="menu" className="space-y-12 scroll-mt-24">
            <div className="text-center space-y-4">
                <span className="text-primary font-medium tracking-widest uppercase text-xs md:text-sm">Découvrez nos créations</span>
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-secondary">La Carte</h2>
                <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
            </div>

            {/* Category Filter - Sticky */}
            {categories.length > 0 && (
                <div className="sticky top-20 z-40 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-border/50 mb-8">
                    <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2">
                        <Button
                            variant={activeCategory === "Tous" ? "default" : "outline"}
                            onClick={() => setActiveCategory("Tous")}
                            className="rounded-full px-6 flex-shrink-0 shadow-sm"
                        >
                            Tous
                        </Button>
                        {categories.map(cat => (
                            <Button
                                key={cat}
                                variant={activeCategory === cat ? "default" : "outline"}
                                onClick={() => setActiveCategory(cat)}
                                className="rounded-full px-6 capitalize flex-shrink-0 shadow-sm"
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Grid - 2 Cols max because of 8-col parent */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProducts.map((product) => (
                    <div
                        key={product.id}
                        className="group flex flex-col h-full bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01]"
                    >
                        {/* Image */}
                        <div className="relative h-64 w-full overflow-hidden bg-muted">
                            {product.image_url ? (
                                <Image
                                    src={product.image_url}
                                    alt={product.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted/50">
                                    <span className="text-xs">Image non disponible</span>
                                </div>
                            )}
                            <div className="absolute top-4 right-4">
                                <Badge className="bg-white/90 text-foreground backdrop-blur-md shadow-sm font-bold text-lg px-3 py-1">
                                    {(product.price_cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                </Badge>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex-1 flex flex-col space-y-4">
                            <div>
                                <h3 className="text-xl font-serif font-bold text-card-foreground group-hover:text-primary transition-colors">
                                    {product.name}
                                </h3>
                                <p className="text-muted-foreground text-sm mt-2 line-clamp-3">
                                    {product.description}
                                </p>
                            </div>

                            <div className="pt-4 mt-auto border-t border-border flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    {product.category}
                                </span>
                                <Button
                                    size="sm"
                                    className="rounded-full gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => addItem(product)}
                                >
                                    <Plus className="h-4 w-4" /> Ajouter
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                    <p>Aucun plat trouvé pour cette catégorie.</p>
                </div>
            )}
        </section>
    );
}
