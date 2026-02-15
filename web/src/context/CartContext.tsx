"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";

export interface CartItem {
    productId: string;
    name: string;
    priceCents: number;
    quantity: number;
    imageUrl?: string | null;
}

interface CartContextType {
    items: CartItem[];
    addItem: (product: any) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    totalCents: number;
    itemCount: number;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from local storage
    useEffect(() => {
        const stored = localStorage.getItem("cart");
        if (stored) {
            try {
                setItems(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse cart", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to local storage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("cart", JSON.stringify(items));
        }
    }, [items, isLoaded]);

    const addItem = (product: any) => {
        setItems(prev => {
            const existing = prev.find(i => i.productId === product.id);
            if (existing) {
                toast.success(`Quantité mise à jour : ${product.name}`);
                return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            toast.success(`Ajouté au panier : ${product.name}`);
            // setIsOpen(true); // Don't open automatically
            return [...prev, {
                productId: product.id,
                name: product.name,
                priceCents: product.price_cents,
                imageUrl: product.image_url,
                quantity: 1
            }];
        });
    };

    const removeItem = (productId: string) => {
        setItems(prev => prev.filter(i => i.productId !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId);
            return;
        }
        setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity } : i));
    };

    const clearCart = () => {
        setItems([]);
        setIsOpen(false);
    };

    const totalCents = items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            items,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
            totalCents,
            itemCount,
            isOpen,
            setIsOpen
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
