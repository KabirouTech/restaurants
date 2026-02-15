"use client";

import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function CartFloatingButton() {
    const { itemCount, setIsOpen } = useCart();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(itemCount > 0);
    }, [itemCount]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 zoom-in duration-300">
            <Button
                size="lg"
                className="rounded-full shadow-lg h-14 w-14 p-0 relative bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => setIsOpen(true)}
            >
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -top-2 -right-1 h-6 w-6 bg-secondary text-secondary-foreground text-xs font-bold rounded-full flex items-center justify-center border-2 border-background">
                    {itemCount}
                </span>
            </Button>
        </div>
    );
}
