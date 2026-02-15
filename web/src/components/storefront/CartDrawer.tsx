"use client";

import { useCart } from "@/context/CartContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, Minus, Plus, Trash2, ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

import { submitOrder } from "@/actions/order";

export function CartDrawer({ orgId }: { orgId: string }) {
    const { items, removeItem, updateQuantity, totalCents, itemCount, isOpen, setIsOpen, clearCart } = useCart();
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [customerDetails, setCustomerDetails] = useState({
        name: "",
        email: "",
        phone: "",
        date: "",
        notes: ""
    });

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await submitOrder(orgId, customerDetails, items, totalCents);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Demande de devis envoyée avec succès !");
            clearCart();
            setIsCheckoutOpen(false);
            setCustomerDetails({ name: "", email: "", phone: "", date: "", notes: "" });
        } catch (error) {
            toast.error("Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
                {!isCheckoutOpen ? (
                    <>
                        <SheetHeader className="px-6 py-4 border-b border-border">
                            <SheetTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Panier ({itemCount})
                            </SheetTitle>
                        </SheetHeader>

                        <ScrollArea className="flex-1 px-6">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-4">
                                    <ShoppingCart className="h-12 w-12 opacity-20" />
                                    <p>Votre panier est vide</p>
                                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                                        Retour au menu
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6 py-6">
                                    {items.map((item) => (
                                        <div key={item.productId} className="flex gap-4">
                                            {/* Image */}
                                            <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                                                {item.imageUrl ? (
                                                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground">No img</div>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                                                    <p className="text-sm font-semibold text-primary">
                                                        {(item.priceCents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline" size="icon" className="h-6 w-6 rounded-full"
                                                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="text-sm w-4 text-center">{item.quantity}</span>
                                                        <Button
                                                            variant="outline" size="icon" className="h-6 w-6 rounded-full"
                                                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    <Button
                                                        variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                        onClick={() => removeItem(item.productId)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>

                        {items.length > 0 && (
                            <div className="border-t border-border p-6 bg-muted/10 space-y-4">
                                <div className="space-y-1.5 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Sous-total</span>
                                        <span>{(totalCents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-border/50">
                                        <span>Total (Estimé)</span>
                                        <span className="text-primary">{(totalCents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                                    </div>
                                </div>
                                <Button className="w-full gap-2 text-lg" size="lg" onClick={() => setIsCheckoutOpen(true)}>
                                    Commander <ChevronRight className="h-5 w-5" />
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <SheetHeader className="px-6 py-4 border-b border-border">
                            <SheetTitle>Vos Coordonnées</SheetTitle>
                            <SheetDescription>Remplissez ce formulaire pour recevoir votre devis.</SheetDescription>
                        </SheetHeader>

                        <ScrollArea className="flex-1 px-6">
                            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-4 py-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nom complet</label>
                                    <input
                                        required
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={customerDetails.name}
                                        onChange={e => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                                        placeholder="Jean Dupont"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <input
                                        required type="email"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={customerDetails.email}
                                        onChange={e => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                                        placeholder="jean@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Téléphone</label>
                                    <input
                                        required type="tel"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={customerDetails.phone}
                                        onChange={e => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                                        placeholder="+221 77 ..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Date de l'événement</label>
                                    <input
                                        required type="date"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={customerDetails.date}
                                        onChange={e => setCustomerDetails({ ...customerDetails, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Notes (Allergies, etc.)</label>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={customerDetails.notes}
                                        onChange={e => setCustomerDetails({ ...customerDetails, notes: e.target.value })}
                                    />
                                </div>
                            </form>
                        </ScrollArea>

                        <div className="border-t border-border p-6 bg-muted/10 flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setIsCheckoutOpen(false)}>
                                Retour
                            </Button>
                            <Button className="flex-1" type="submit" form="checkout-form" disabled={loading}>
                                {loading ? "Envoi..." : "Confirmer"}
                            </Button>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
