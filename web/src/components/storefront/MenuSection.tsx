"use client";

import { useState } from "react";
import { Plus, Minus, ShoppingBag, Trash2, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, CartItem } from "@/context/CartContext";
import { cn } from "@/lib/utils";

interface Product {
    id: string;
    name: string;
    description: string | null;
    price_cents: number;
    image_url: string | null;
    category: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmt = (cents: number) =>
    (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

// ─── Single product row (left panel) ─────────────────────────────────────────
function ProductRow({
    product,
    qty,
    onAdd,
    onRemove,
}: {
    product: Product;
    qty: number;
    onAdd: () => void;
    onRemove: () => void;
}) {
    return (
        <div className={cn(
            "flex items-center gap-3 p-2.5 rounded-xl transition-all duration-150 border group relative",
            qty > 0
                ? "bg-primary/5 border-primary/20"
                : "bg-transparent border-transparent hover:bg-muted/50"
        )}>
            {/* Thumbnail */}
            <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-muted relative">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-xl">🍽️</div>
                )}
                {qty > 0 && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center backdrop-blur-[1px]">
                        <span className="font-bold text-white drop-shadow-md text-sm">x{qty}</span>
                    </div>
                )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <p className={cn(
                    "text-sm font-semibold truncate leading-tight group-hover:text-primary transition-colors",
                    qty > 0 ? "text-primary" : "text-secondary"
                )}>
                    {product.name}
                </p>
                <p className="text-xs font-bold text-muted-foreground mt-0.5">{fmt(product.price_cents)}</p>
            </div>

            {/* Controls */}
            {qty === 0 ? (
                <button
                    onClick={onAdd}
                    className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/30 hover:bg-primary/90 active:scale-90 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 translate-x-2 group-hover:translate-x-0"
                >
                    <Plus className="h-4 w-4" />
                </button>
            ) : (
                <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2 duration-200">
                    <button
                        onClick={onRemove}
                        className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-muted active:scale-90 transition-all bg-background"
                    >
                        <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold text-primary tabular-nums">{qty}</span>
                    <button
                        onClick={onAdd}
                        className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 active:scale-90 transition-all shadow-sm"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Right panel: live order summary (read-only mostly, mirrors Cart) ────────
function OrderSummary({
    items,
    totalCents,
    onRemoveLine,
    onOpenCart,
}: {
    items: CartItem[];
    totalCents: number;
    onRemoveLine: (id: string) => void;
    onOpenCart: () => void;
}) {
    const count = items.reduce((acc, l) => acc + l.quantity, 0);

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-2xl border-2 border-dashed border-border/60 text-muted-foreground gap-3 p-8 text-center bg-card/30">
                <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center">
                    <ShoppingBag className="h-7 w-7 opacity-40" />
                </div>
                <p className="text-sm font-medium">Votre panier est vide</p>
                <p className="text-xs opacity-60 max-w-[200px]">Sélectionnez vos plats à gauche pour commencer votre commande</p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between bg-muted/20">
                <div>
                    <p className="font-bold text-secondary text-base">Votre commande</p>
                    <p className="text-xs text-muted-foreground font-medium">{count} article{count > 1 ? "s" : ""}</p>
                </div>
                <div className="relative">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <ShoppingBag className="h-4 w-4 text-primary" />
                    </div>
                </div>
            </div>

            {/* Line items (Scrollable) */}
            <div className="divide-y divide-border/40 max-h-[320px] overflow-y-auto bg-background/50">
                {items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 px-5 py-3 group hover:bg-muted/30 transition-colors">
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                                <p className="text-sm font-semibold text-secondary truncate pr-2">{item.name}</p>
                                <p className="text-xs font-bold text-primary shrink-0">
                                    {fmt(item.priceCents * item.quantity)}
                                </p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{item.quantity} × {fmt(item.priceCents)}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => onRemoveLine(item.productId)}
                            className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                            title="Retirer du panier"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Total + CTA */}
            <div className="p-5 border-t border-border/50 space-y-4 bg-muted/5">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-muted-foreground">Total à payer</span>
                    <span className="text-2xl font-black text-primary tracking-tight">{fmt(totalCents)}</span>
                </div>
                <Button
                    onClick={onOpenCart}
                    className="w-full rounded-xl py-6 gap-2 text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] transition-all"
                >
                    Voir le détail & Commander
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export function MenuSection({ products }: { products: Product[] }) {
    const categories = ["Tous", ...Array.from(new Set(products.map((p) => p.category))).sort()];
    const [activeCategory, setActiveCategory] = useState("Tous");

    // Use global cart context directly = persistence achieved
    const { items, addItem, updateQuantity, removeItem, totalCents, openCart } = useCart();

    const getQty = (id: string) => items.find((i) => i.productId === id)?.quantity ?? 0;

    const handleAdd = (product: Product) => {
        addItem(product);
    };

    const handleRemove = (product: Product) => {
        const currentQty = getQty(product.id);
        if (currentQty > 0) {
            updateQuantity(product.id, currentQty - 1);
        }
    };

    const filtered = activeCategory === "Tous"
        ? products
        : products.filter((p) => p.category === activeCategory);

    return (
        <section id="menu" className="scroll-mt-24 py-16 lg:py-24">
            {/* Section heading */}
            <div className="text-center space-y-3 mb-10">
                <span className="text-primary font-medium tracking-widest uppercase text-xs">Découvrez nos créations</span>
                <h2 className="text-4xl lg:text-5xl font-serif font-bold text-secondary">La Carte</h2>
                <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
            </div>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-6 sticky top-20 z-10 bg-background/80 backdrop-blur-sm py-2 -mx-4 px-4 lg:mx-0 lg:px-0">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                            "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border select-none",
                            activeCategory === cat
                                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-105"
                                : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start relative">

                {/* LEFT — Product list */}
                <div className="lg:col-span-3">
                    <div className="space-y-4 min-h-[400px]">
                        {filtered.length === 0 ? (
                            <p className="text-center py-12 text-muted-foreground text-sm">
                                Aucun plat dans cette catégorie.
                            </p>
                        ) : (
                            filtered.map((product) => (
                                <ProductRow
                                    key={product.id}
                                    product={product}
                                    qty={getQty(product.id)}
                                    onAdd={() => handleAdd(product)}
                                    onRemove={() => handleRemove(product)}
                                />
                            ))
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-6 text-center lg:text-left">
                        {filtered.length} plat{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
                    </p>
                </div>

                {/* RIGHT — Live global cart summary (sticky) */}
                <div className="lg:col-span-2 hidden lg:block lg:sticky lg:top-32 h-fit transition-all duration-300">
                    <OrderSummary
                        items={items}
                        totalCents={totalCents}
                        onRemoveLine={removeItem}
                        onOpenCart={openCart}
                    />
                </div>

                {/* Mobile Floating Action Button (if cart has items, show summary trigger) */}
                {items.length > 0 && (
                    <div className="fixed bottom-6 left-4 right-4 z-40 lg:hidden animate-in slide-in-from-bottom-4 zoom-in duration-300">
                        <Button
                            onClick={openCart}
                            size="lg"
                            className="w-full rounded-2xl shadow-xl shadow-primary/30 py-6 text-base font-bold flex justify-between items-center px-6"
                        >
                            <span className="flex items-center gap-2">
                                <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{items.reduce((a, b) => a + b.quantity, 0)}</span>
                                <span>Voir ma commande</span>
                            </span>
                            <span>{fmt(totalCents)}</span>
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}
