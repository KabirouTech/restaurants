"use client";

import { useCart } from "@/context/CartContext";
import { ShoppingBasket, X, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

export function CurrentOrderWidget() {
    const { items, removeItem, updateQuantity, totalCents } = useCart();

    if (items.length === 0) {
        return (
            <div className="bg-white dark:bg-card rounded-2xl shadow-sm p-6 border border-border opacity-70 cursor-not-allowed">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif font-bold text-lg">Commande Actuelle</h3>
                    <span className="text-sm text-muted-foreground">0 Articles</span>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground space-y-2 border-2 border-dashed border-border rounded-xl">
                    <ShoppingBasket className="h-8 w-8 text-muted-foreground/50" />
                    <span className="text-sm">Votre panier est vide</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20">
                <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                    <ShoppingBasket className="h-5 w-5 text-primary" />
                    Commande Actuelle
                </h3>
            </div>

            <ScrollArea className="h-[300px] p-4">
                <div className="space-y-4">
                    {items.map((item) => (
                        <div key={item.productId} className="flex gap-3 relative group">
                            <div className="h-16 w-16 relative rounded-md overflow-hidden bg-muted shrink-0">
                                {item.imageUrl && (
                                    <Image
                                        src={item.imageUrl}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                    />
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <span className="text-sm font-medium line-clamp-2 leading-tight pr-4">
                                        {item.name}
                                    </span>
                                    <button
                                        onClick={() => removeItem(item.productId)}
                                        className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-0.5">
                                        <button
                                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                            className="h-6 w-6 flex items-center justify-center hover:bg-white rounded-md transition-shadow"
                                        >
                                            <Minus className="h-3 w-3" />
                                        </button>
                                        <span className="text-xs font-semibold w-4 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                            className="h-6 w-6 flex items-center justify-center hover:bg-white rounded-md transition-shadow"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </button>
                                    </div>
                                    <span className="text-sm font-bold text-primary">
                                        {((item.priceCents * item.quantity) / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="p-4 bg-muted/20 border-t border-border space-y-4">
                <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span>{(totalCents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</span>
                </div>
                <Button className="w-full font-bold" size="lg">
                    Valider la commande
                </Button>
            </div>
        </div>
    );
}
