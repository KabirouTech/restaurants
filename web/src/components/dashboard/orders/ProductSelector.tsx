"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Product = {
    id: string;
    name: string;
    price_cents: number;
    category: string;
    description: string;
};

interface ProductSelectorProps {
    products: Product[];
    onAdd: (product: Product) => void;
}

export function ProductSelector({ products, onAdd }: ProductSelectorProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("Tout");

    const categories = ["Tout", ...Array.from(new Set(products.map(p => p.category)))];

    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === "Tout" || p.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="p-3 border-b bg-muted/10 space-y-3">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un plat..."
                        className="pl-9 h-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={cn(
                                "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-colors",
                                categoryFilter === cat
                                    ? "bg-secondary text-white border-secondary"
                                    : "bg-white text-muted-foreground border-border hover:bg-muted"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filtered.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">Aucun résultat</div>
                ) : (
                    filtered.map(product => (
                        <div
                            key={product.id}
                            className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50 transition-colors group cursor-pointer border border-transparent hover:border-border"
                            onClick={() => onAdd(product)}
                        >
                            <div className="flex flex-col overflow-hidden">
                                <span className="font-medium text-sm truncate">{product.name}</span>
                                <span className="text-xs text-muted-foreground line-clamp-1">{product.category}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono font-medium">
                                    {(product.price_cents / 100).toFixed(2)}€
                                </span>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-full opacity-0 group-hover:opacity-100">
                                    +
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
