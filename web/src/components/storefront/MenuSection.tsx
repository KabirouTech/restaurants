"use client";

import { useState } from "react";
import { Plus, Minus, ShoppingBag, Trash2, ChevronRight, X, Search, ShoppingCart, Star, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, CartItem } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import type { StorefrontTemplate } from "@/lib/storefront-templates";

interface Product {
    id: string;
    name: string;
    description: string | null;
    price_cents: number;
    image_url: string | null;
    category: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────
import { formatPrice } from "@/lib/currencies";

// ─── Single product row (left panel) ─────────────────────────────────────────
function ProductRow({
    product,
    qty,
    currency,
    onAdd,
    onRemove,
}: {
    product: Product;
    qty: number;
    currency: string;
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
                <img
                    src={product.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop"}
                    alt={product.name}
                    onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop"; }}
                    className="h-full w-full object-cover"
                />
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
                <p className="text-xs font-bold text-muted-foreground mt-0.5">{formatPrice(product.price_cents, currency)}</p>
            </div>

            {/* Controls */}
            {qty === 0 ? (
                <button
                    onClick={onAdd}
                    className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/30 hover:bg-primary/90 active:scale-90 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 translate-x-0 md:translate-x-2 md:group-hover:translate-x-0"
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
    currency,
}: {
    items: CartItem[];
    totalCents: number;
    onRemoveLine: (id: string) => void;
    onOpenCart: () => void;
    currency: string;
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
                                    {formatPrice(item.priceCents * item.quantity, currency)}
                                </p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{item.quantity} × {formatPrice(item.priceCents, currency)}</span>
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
                    <span className="text-2xl font-black text-primary tracking-tight">{formatPrice(totalCents, currency)}</span>
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
export function MenuSection({
    products,
    currency,
    template = "classic",
}: {
    products: Product[];
    currency: string;
    template?: StorefrontTemplate;
}) {
    const categories = ["Tous", ...Array.from(new Set(products.map((p) => p.category))).sort()];
    const [activeCategory, setActiveCategory] = useState("Tous");
    const [search, setSearch] = useState("");

    const { items, addItem, updateQuantity, removeItem, totalCents, openCart } = useCart();

    const getQty = (id: string) => items.find((i) => i.productId === id)?.quantity ?? 0;

    const handleAdd = (product: Product) => addItem(product);
    const handleRemove = (product: Product) => {
        const currentQty = getQty(product.id);
        if (currentQty > 0) updateQuantity(product.id, currentQty - 1);
    };

    const filtered = products
        .filter((p) => activeCategory === "Tous" || p.category === activeCategory)
        .filter((p) => {
            const q = search.toLowerCase().trim();
            if (!q) return true;
            return (
                p.name.toLowerCase().includes(q) ||
                (p.description || "").toLowerCase().includes(q)
            );
        });

    if (template === "catering") {
        const featuredProducts = products;
        return (
            <section id="menu" className="scroll-mt-24 py-16 lg:py-20">
                <div className="text-center mb-10 space-y-3">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">In digital documentary</p>
                    <h2 className="text-4xl lg:text-5xl font-outfit font-bold text-zinc-900">Taly Feedback</h2>
                    <div className="flex items-center justify-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-700" />
                        <span className="h-2 w-2 rounded-full bg-emerald-500/40" />
                        <span className="h-2 w-2 rounded-full bg-emerald-500/40" />
                    </div>
                </div>

                {featuredProducts.length === 0 ? (
                    <div className="rounded-3xl border border-emerald-100 bg-[#f8fbf8] px-8 py-12 text-center text-zinc-600">
                        Ajoutez vos plats dans le menu pour voir les cartes ici.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {featuredProducts.map((product) => (
                            <article key={product.id} className="rounded-[22px] overflow-hidden border border-zinc-200/90 bg-white shadow-[0_16px_36px_-28px_rgba(15,23,42,0.7)]">
                                <div className="relative h-56">
                                    <img
                                        src={product.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&h=700&fit=crop"}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                        onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&h=700&fit=crop"; }}
                                    />
                                </div>
                                <div className="p-5">
                                    <h3 className="font-outfit font-semibold text-[1.35rem] leading-tight text-zinc-900">{product.name}</h3>
                                    <p className="text-sm text-zinc-600 mt-2 min-h-[2.75rem]">
                                        {product.description || "Une specialite maison preparee avec des ingredients frais."}
                                    </p>
                                    <div className="mt-4 flex items-center justify-between gap-2">
                                        <span className="font-semibold text-emerald-700 text-[15px]">{formatPrice(product.price_cents, currency)}</span>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="rounded-full border-zinc-300 bg-white"
                                                onClick={openCart}
                                            >
                                                Panier
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                                                onClick={() => handleAdd(product)}
                                            >
                                                Ajouter
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        );
    }

    // ─── FoodieDash ──────────────────────────────────────────────────────────
    if (template === "foodiedash") {
        return (
            <section id="menu" className="scroll-mt-24 py-16 lg:py-20">
                {/* Section heading */}
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <p className="text-xs uppercase tracking-widest text-orange-500 font-semibold mb-1">Our Menu</p>
                        <h2 className="text-3xl lg:text-4xl font-bold text-secondary">Featured Dishes</h2>
                    </div>
                    <button className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors flex items-center gap-1">
                        View All <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                {/* Category pills */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-1">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border select-none shrink-0",
                                activeCategory === cat
                                    ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/25"
                                    : "bg-white text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-500"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <div className="rounded-3xl border border-orange-100 bg-orange-50/50 px-8 py-12 text-center text-slate-500">
                        Aucun plat trouvé dans cette catégorie.
                    </div>
                ) : (
                    <div className="bg-[#f27f0d]/5 rounded-3xl p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((product) => {
                            const qty = getQty(product.id);
                            return (
                                <article key={product.id} className="rounded-3xl overflow-hidden bg-white shadow-lg shadow-slate-200/60 hover:shadow-xl transition-shadow duration-300 group">
                                    {/* Image */}
                                    <div className="relative h-64 overflow-hidden">
                                        <img
                                            src={product.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&h=700&fit=crop"}
                                            alt={product.name}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&h=700&fit=crop"; }}
                                        />
                                        {/* Star rating badge */}
                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow-sm">
                                            <Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
                                            <span className="text-xs font-bold text-slate-700">4.8</span>
                                        </div>
                                        {qty > 0 && (
                                            <div className="absolute top-3 left-3 bg-orange-500 text-white rounded-full h-7 w-7 flex items-center justify-center text-xs font-bold shadow-md">
                                                {qty}
                                            </div>
                                        )}
                                    </div>
                                    {/* Content */}
                                    <div className="p-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold text-lg text-secondary truncate pr-2">{product.name}</h3>
                                            <span className="text-orange-500 font-bold text-base shrink-0">{formatPrice(product.price_cents, currency)}</span>
                                        </div>
                                        <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                                            {product.description || "Un plat savoureux préparé avec des ingrédients frais."}
                                        </p>
                                        <Button
                                            onClick={() => handleAdd(product)}
                                            variant="ghost"
                                            className="w-full rounded-xl bg-zinc-100 hover:bg-[#f27f0d] hover:text-white text-slate-700 font-semibold gap-2 active:scale-[0.98] transition-all"
                                        >
                                            <ShoppingCart className="h-4 w-4" />
                                            Add to Cart
                                        </Button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                    </div>
                )}

                {/* Mobile floating cart */}
                {items.length > 0 && (
                    <div className="fixed bottom-[72px] left-4 right-4 z-40 lg:hidden animate-in slide-in-from-bottom-4 duration-300">
                        <Button
                            onClick={openCart}
                            size="lg"
                            className="w-full rounded-2xl bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-500/30 py-6 text-base font-bold flex justify-between items-center px-6"
                        >
                            <span className="flex items-center gap-2">
                                <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{items.reduce((a, b) => a + b.quantity, 0)}</span>
                                <span>View Cart</span>
                            </span>
                            <span>{formatPrice(totalCents, currency)}</span>
                        </Button>
                    </div>
                )}
            </section>
        );
    }

    // ─── Elite ───────────────────────────────────────────────────────────────
    if (template === "elite") {
        const eliteCategories = Array.from(new Set(products.map((p) => p.category))).sort();
        const [eliteTab, setEliteTab] = [activeCategory === "Tous" ? (eliteCategories[0] || "Tous") : activeCategory, setActiveCategory];

        const eliteFiltered = products.filter((p) => eliteTab === "Tous" || p.category === eliteTab);

        return (
            <section id="menu" className="scroll-mt-24 py-16 lg:py-20">
                {/* Section heading */}
                <div className="text-center mb-10 space-y-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-amber-600/80 font-medium">Exquisite Selection</p>
                    <h2 className="text-4xl lg:text-5xl font-serif font-bold text-white">Our Menu</h2>
                    <div className="w-16 h-px bg-amber-600/40 mx-auto" />
                </div>

                {/* Category tabs */}
                <div className="flex justify-center gap-1 mb-10 border-b border-white/10">
                    {eliteCategories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setEliteTab(cat)}
                            className={cn(
                                "px-6 py-3 text-sm font-medium tracking-wide transition-all border-b-2 -mb-px",
                                eliteTab === cat
                                    ? "border-primary text-primary"
                                    : "border-transparent text-zinc-400 hover:text-zinc-300"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {eliteFiltered.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-12 text-center text-zinc-400">
                        Aucun plat dans cette catégorie.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-1">
                        {eliteFiltered.map((product) => {
                            const qty = getQty(product.id);
                            return (
                                <div
                                    key={product.id}
                                    className="flex items-center gap-5 py-5 border-b border-white/10 group cursor-pointer"
                                    onClick={() => handleAdd(product)}
                                >
                                    {/* Circular image */}
                                    <div className="size-24 shrink-0 rounded-full overflow-hidden border-2 border-white/10 shadow-sm relative">
                                        <img
                                            src={product.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop"}
                                            alt={product.name}
                                            className="h-full w-full object-cover"
                                            onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop"; }}
                                        />
                                        {qty > 0 && (
                                            <div className="absolute inset-0 bg-amber-600/20 flex items-center justify-center backdrop-blur-[1px]">
                                                <span className="font-bold text-white drop-shadow-md text-sm">x{qty}</span>
                                            </div>
                                        )}
                                    </div>
                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-3 mb-1">
                                            <h3 className="font-bold text-base text-white truncate group-hover:text-primary transition-colors">
                                                {product.name}
                                            </h3>
                                            <div className="flex-1 mx-3 border-b border-dotted border-white/20" />
                                            <span className="text-zinc-400 font-medium text-sm shrink-0">
                                                {formatPrice(product.price_cents, currency)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-400 italic line-clamp-2">
                                            {product.description || "Préparé avec soin par notre chef."}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Download CTA */}
                <div className="mt-12 text-center">
                    <Button
                        variant="outline"
                        className="rounded-full px-8 py-5 border border-primary text-primary hover:bg-primary hover:text-white uppercase tracking-widest text-sm font-medium gap-2 transition-all"
                        onClick={openCart}
                    >
                        <Download className="h-4 w-4" />
                        Download Full Menu
                    </Button>
                </div>

                {/* Mobile floating cart */}
                {items.length > 0 && (
                    <div className="fixed bottom-[72px] left-4 right-4 z-40 lg:hidden animate-in slide-in-from-bottom-4 duration-300">
                        <Button
                            onClick={openCart}
                            size="lg"
                            className="w-full rounded-2xl bg-amber-700 hover:bg-amber-800 shadow-xl shadow-amber-700/30 py-6 text-base font-bold flex justify-between items-center px-6"
                        >
                            <span className="flex items-center gap-2">
                                <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{items.reduce((a, b) => a + b.quantity, 0)}</span>
                                <span>Voir ma commande</span>
                            </span>
                            <span>{formatPrice(totalCents, currency)}</span>
                        </Button>
                    </div>
                )}
            </section>
        );
    }

    // ─── AromaBrew ────────────────────────────────────────────────────────────
    if (template === "aromabrew") {
        return (
            <section id="menu" className="scroll-mt-24 py-16 lg:py-20">
                {/* Section heading */}
                <div className="text-center mb-10 space-y-2">
                    <p className="text-xs uppercase tracking-[0.25em] text-yellow-600 font-medium">Our Selection</p>
                    <h2 className="text-3xl lg:text-4xl font-bold text-white">The Menu</h2>
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                        <span className="h-1 w-8 rounded-full bg-yellow-500" />
                        <span className="h-1 w-1 rounded-full bg-yellow-500/40" />
                        <span className="h-1 w-1 rounded-full bg-yellow-500/40" />
                    </div>
                </div>

                {/* Category pills */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-1 justify-center">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border select-none shrink-0",
                                activeCategory === cat
                                    ? "bg-yellow-600 text-white border-yellow-600"
                                    : "bg-white/5 text-zinc-400 border-white/10 hover:border-yellow-400 hover:text-yellow-500"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-12 text-center text-zinc-400">
                        Aucun produit trouvé.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {filtered.map((product) => {
                            const qty = getQty(product.id);
                            return (
                                <article
                                    key={product.id}
                                    className="group cursor-pointer"
                                    onClick={() => handleAdd(product)}
                                >
                                    {/* Square image */}
                                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
                                        <img
                                            src={product.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=500&fit=crop"}
                                            alt={product.name}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&h=500&fit=crop"; }}
                                        />
                                        {/* Star rating badge bottom-right */}
                                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                            <span className="text-[10px] font-bold text-white">4.9</span>
                                        </div>
                                        {qty > 0 && (
                                            <div className="absolute top-2 left-2 bg-yellow-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-[10px] font-bold shadow">
                                                {qty}
                                            </div>
                                        )}
                                    </div>
                                    {/* Text */}
                                    <h3 className="font-bold text-sm text-white truncate group-hover:text-[#f4c025] transition-colors">
                                        {product.name}
                                    </h3>
                                    <p className="text-[#f4c025] font-bold text-sm mt-0.5">
                                        {formatPrice(product.price_cents, currency)}
                                    </p>
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* Mobile floating cart */}
                {items.length > 0 && (
                    <div className="fixed bottom-[72px] left-4 right-4 z-40 lg:hidden animate-in slide-in-from-bottom-4 duration-300">
                        <Button
                            onClick={openCart}
                            size="lg"
                            className="w-full rounded-2xl bg-yellow-600 hover:bg-yellow-700 shadow-xl shadow-yellow-600/30 py-6 text-base font-bold flex justify-between items-center px-6"
                        >
                            <span className="flex items-center gap-2">
                                <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{items.reduce((a, b) => a + b.quantity, 0)}</span>
                                <span>View Cart</span>
                            </span>
                            <span>{formatPrice(totalCents, currency)}</span>
                        </Button>
                    </div>
                )}
            </section>
        );
    }

    // ─── Culina ──────────────────────────────────────────────────────────────
    if (template === "culina") {
        const accentColors = [
            "bg-emerald-400",
            "bg-amber-500",
            "bg-pink-500",
            "bg-emerald-400",
            "bg-amber-500",
            "bg-pink-500",
        ];

        return (
            <section id="menu" className="scroll-mt-24 py-16 lg:py-20">
                {/* Section heading */}
                <div className="text-center mb-10 space-y-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-emerald-400 font-semibold">Explore</p>
                    <h2 className="text-4xl lg:text-5xl font-bold text-white">Notre Carte</h2>
                    <div className="w-12 h-1 bg-emerald-400 mx-auto rounded-full" />
                </div>

                {/* Category pills */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-1 justify-center">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border select-none shrink-0",
                                activeCategory === cat
                                    ? "bg-emerald-400 text-slate-900 border-emerald-400 shadow-lg shadow-emerald-400/25"
                                    : "bg-slate-800 text-slate-400 border-slate-700 hover:border-emerald-400/50 hover:text-emerald-400"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <div className="rounded-3xl border border-slate-700 bg-slate-800 px-8 py-12 text-center text-slate-400">
                        Aucun plat trouvé dans cette catégorie.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((product, index) => {
                            const accent = accentColors[index % accentColors.length];
                            const qty = getQty(product.id);
                            return (
                                <article key={product.id} className="rounded-3xl overflow-hidden bg-slate-900 shadow-2xl shadow-black/40 group relative aspect-[3/4] flex flex-col">
                                    {/* Image with gradient overlay */}
                                    <div className="relative flex-1 overflow-hidden">
                                        <img
                                            src={product.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&h=900&fit=crop"}
                                            alt={product.name}
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&h=900&fit=crop"; }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                                        {qty > 0 && (
                                            <div className="absolute top-3 right-3 bg-emerald-400 text-slate-900 rounded-full h-7 w-7 flex items-center justify-center text-xs font-bold shadow-md">
                                                {qty}
                                            </div>
                                        )}
                                    </div>
                                    {/* Bottom content */}
                                    <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3">
                                        {/* Accent bar */}
                                        <div className={cn("h-1 w-10 rounded-full", accent)} />
                                        <h3 className="font-bold italic text-lg text-white leading-tight">{product.name}</h3>
                                        <p className="text-sm text-slate-400 line-clamp-2">
                                            {product.description || "Une expérience culinaire unique."}
                                        </p>
                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-emerald-400 font-bold text-base">{formatPrice(product.price_cents, currency)}</span>
                                            <button
                                                onClick={() => handleAdd(product)}
                                                className={cn("px-4 py-2 rounded-full border text-white text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-slate-900 transition-all active:scale-95", accent.replace("bg-", "border-"))}
                                            >
                                                Découvrir
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* Mobile floating cart */}
                {items.length > 0 && (
                    <div className="fixed bottom-[72px] left-4 right-4 z-40 lg:hidden animate-in slide-in-from-bottom-4 duration-300">
                        <Button
                            onClick={openCart}
                            size="lg"
                            className="w-full rounded-2xl bg-emerald-400 hover:bg-emerald-500 text-slate-900 shadow-xl shadow-emerald-400/30 py-6 text-base font-bold flex justify-between items-center px-6"
                        >
                            <span className="flex items-center gap-2">
                                <span className="bg-black/20 px-2 py-0.5 rounded text-sm">{items.reduce((a, b) => a + b.quantity, 0)}</span>
                                <span>View Cart</span>
                            </span>
                            <span>{formatPrice(totalCents, currency)}</span>
                        </Button>
                    </div>
                )}
            </section>
        );
    }

    return (
        <section id="menu" className="scroll-mt-24 py-16 lg:py-24">
            {/* Section heading */}
            <div className="text-center space-y-3 mb-10">
                <span className="text-primary font-medium tracking-widest uppercase text-xs">Découvrez nos créations</span>
                <h2 className="text-4xl lg:text-5xl font-serif font-bold text-secondary">La Carte</h2>
                <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
            </div>

            {/* Filters row: category pills + search bar */}
            <div className="sticky top-20 z-10 bg-background/80 backdrop-blur-sm py-2 -mx-4 px-4 lg:mx-0 lg:px-0 mb-6">
                <div className="flex items-center gap-3">
                    {/* Category pills — scrollable horizontally */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1 pb-1">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={cn(
                                    "px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border select-none shrink-0",
                                    activeCategory === cat
                                        ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20 scale-105"
                                        : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Search input */}
                    <div className="relative shrink-0 hidden md:block w-48 lg:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher un plat..."
                            className="w-full pl-8 pr-8 py-2 text-sm rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start relative">

                {/* LEFT — Product list (scrollable) */}
                <div className="lg:col-span-3">
                    {/* Results count */}
                    <p className="text-xs text-muted-foreground mb-3">
                        {filtered.length} plat{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
                        {search && <span className="ml-1">pour « <strong>{search}</strong> »</span>}
                    </p>

                    {/* Scrollable product list */}
                    <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm text-center">
                                <Search className="h-8 w-8 mb-3 opacity-30" />
                                <p>Aucun plat trouvé{search ? ` pour « ${search} »` : " dans cette catégorie"}.</p>
                                {search && (
                                    <button onClick={() => setSearch("")} className="mt-2 text-primary text-xs underline">
                                        Effacer la recherche
                                    </button>
                                )}
                            </div>
                        ) : (
                            filtered.map((product) => (
                                <ProductRow
                                    key={product.id}
                                    product={product}
                                    qty={getQty(product.id)}
                                    currency={currency}
                                    onAdd={() => handleAdd(product)}
                                    onRemove={() => handleRemove(product)}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT — Live global cart summary (sticky) */}
                <div className="lg:col-span-2 hidden lg:block lg:sticky lg:top-32 h-fit transition-all duration-300">
                    <OrderSummary
                        items={items}
                        totalCents={totalCents}
                        onRemoveLine={removeItem}
                        onOpenCart={openCart}
                        currency={currency}
                    />
                </div>

                {/* Mobile Floating Action Button */}
                {items.length > 0 && (
                    <div className="fixed bottom-[72px] left-4 right-4 z-40 lg:hidden animate-in slide-in-from-bottom-4 zoom-in duration-300">
                        <Button
                            onClick={openCart}
                            size="lg"
                            className="w-full rounded-2xl shadow-xl shadow-primary/30 py-6 text-base font-bold flex justify-between items-center px-6"
                        >
                            <span className="flex items-center gap-2">
                                <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{items.reduce((a, b) => a + b.quantity, 0)}</span>
                                <span>Voir ma commande</span>
                            </span>
                            <span>{formatPrice(totalCents, currency)}</span>
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}
