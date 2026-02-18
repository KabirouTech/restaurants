"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, UserPlus, Loader2, Save } from "lucide-react";
import { createOrderAction } from "@/actions/orders";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ProductSelector } from "./ProductSelector";

// Types
type Product = {
    id: string;
    name: string;
    description: string;
    price_cents: number;
    category: string;
};

type CapacityType = {
    id: string;
    name: string;
    description: string;
};

type Customer = {
    id: string;
    full_name: string;
    email: string;
    phone: string;
};

interface CreateOrderFormProps {
    products: Product[];
    capacityTypes: CapacityType[];
    customers: Customer[];
}



export function CreateOrderForm({ products, capacityTypes, customers }: CreateOrderFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    // Form State
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
    const [isNewCustomer, setIsNewCustomer] = useState(false);

    // New Customer Fields
    const [newCustomerName, setNewCustomerName] = useState("");
    const [newCustomerEmail, setNewCustomerEmail] = useState("");
    const [newCustomerPhone, setNewCustomerPhone] = useState("");

    // Order Details
    const [eventDate, setEventDate] = useState(searchParams.get("date") || "");
    const [eventTime, setEventTime] = useState(searchParams.get("time") || "");
    const [guestCount, setGuestCount] = useState(0);
    const [capacityTypeId, setCapacityTypeId] = useState<string>("");
    const [internalNotes, setInternalNotes] = useState("");

    // Cart
    const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);

    // --- Actions ---

    const handleAddProduct = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const handleUpdateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const handleRemove = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    // --- Calculations ---
    const totalCents = cart.reduce((acc, item) => acc + (item.product.price_cents * item.quantity), 0);

    // --- Submit ---
    const handleSubmit = async () => {
        if (!isNewCustomer && !selectedCustomerId) {
            toast.error("Veuillez sélectionner un client");
            return;
        }
        if (isNewCustomer && !newCustomerName) {
            toast.error("Nom du client requis");
            return;
        }
        if (!eventDate || !capacityTypeId) {
            toast.error("Date et Type d'événement requis");
            return;
        }

        setLoading(true);

        const payload = {
            customerId: isNewCustomer ? null : selectedCustomerId,
            customerName: isNewCustomer ? newCustomerName : undefined,
            customerEmail: isNewCustomer ? newCustomerEmail : undefined,
            customerPhone: isNewCustomer ? newCustomerPhone : undefined,

            eventDate,
            eventTime,
            guestCount,
            capacityTypeId,
            internalNotes,

            totalAmountCents: totalCents,

            items: cart.map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
                unitPriceCents: item.product.price_cents
            }))
        };

        const result = await createOrderAction(payload);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Commande créée avec succès !");
            router.push("/dashboard/orders");
        }
        setLoading(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">

            {/* Left Column: Form & Cart */}
            <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2">

                {/* 1. Client & Details */}
                <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-4">
                    <h3 className="font-serif text-lg font-bold text-secondary border-b pb-2 mb-4">Informations Client & Événement</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Client Select */}
                        <div className="space-y-2 col-span-2 md:col-span-1">
                            <Label>Client</Label>
                            {!isNewCustomer ? (
                                <div className="flex gap-2">
                                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un client..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.full_name} ({c.phone || "Sans tél."})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" size="icon" onClick={() => setIsNewCustomer(true)} title="Nouveau Client">
                                        <UserPlus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2 bg-muted/20 p-3 rounded-lg border border-dashed border-primary/30 animate-in slide-in-from-left duration-300">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-semibold text-primary">Nouveau Client</span>
                                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setIsNewCustomer(false)}>Annuler</Button>
                                    </div>
                                    <Input placeholder="Nom Complet *" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} className="h-8 text-sm" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input placeholder="Email" value={newCustomerEmail} onChange={e => setNewCustomerEmail(e.target.value)} className="h-8 text-sm" />
                                        <Input placeholder="Téléphone" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} className="h-8 text-sm" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Date & Time */}
                        <div className="space-y-2">
                            <Label>Date de l'événement</Label>
                            <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label>Heure (Optionnel)</Label>
                            <Input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} />
                        </div>

                        {/* Capacity Type */}
                        <div className="space-y-2">
                            <Label>Type de Prestation</Label>
                            <Select value={capacityTypeId} onValueChange={setCapacityTypeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Mariage, Livraison..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {capacityTypes.map(ct => (
                                        <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Guest Count */}
                        <div className="space-y-2">
                            <Label>Nombre d'invités</Label>
                            <Input type="number" min="0" value={guestCount} onChange={e => setGuestCount(parseInt(e.target.value) || 0)} />
                        </div>
                    </div>

                    <div className="pt-2">
                        <Label>Notes Internes</Label>
                        <Textarea
                            placeholder="Allergies, préférences, code porte..."
                            className="resize-none h-20"
                            value={internalNotes}
                            onChange={e => setInternalNotes(e.target.value)}
                        />
                    </div>
                </div>

                {/* 2. Cart Summary */}
                <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex-1 flex flex-col">
                    <h3 className="font-serif text-lg font-bold text-secondary border-b pb-2 mb-4 flex justify-between items-center">
                        <span>Détail de la commande</span>
                        <span className="text-sm font-sans font-medium text-muted-foreground">{cart.length} articles</span>
                    </h3>

                    {cart.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-8 border-2 border-dashed border-muted/50 rounded-lg">
                            <p>Le panier est vide.</p>
                            <p className="text-sm">Sélectionnez des articles à droite pour commencer.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px]">
                            <div className="grid grid-cols-12 text-xs font-semibold text-muted-foreground uppercase pb-2 border-b mb-2 px-2">
                                <div className="col-span-6">Article</div>
                                <div className="col-span-2 text-center">Qté</div>
                                <div className="col-span-3 text-right">Prix</div>
                                <div className="col-span-1"></div>
                            </div>
                            {cart.map(item => (
                                <div key={item.product.id} className="grid grid-cols-12 items-center text-sm py-2 px-2 hover:bg-muted/10 rounded group">
                                    <div className="col-span-6 font-medium truncate pr-2" title={item.product.name}>
                                        {item.product.name}
                                    </div>
                                    <div className="col-span-2 flex justify-center items-center gap-1">
                                        <button onClick={() => handleUpdateQuantity(item.product.id, -1)} className="hover:bg-muted rounded px-1">-</button>
                                        <span className="w-6 text-center">{item.quantity}</span>
                                        <button onClick={() => handleUpdateQuantity(item.product.id, 1)} className="hover:bg-muted rounded px-1">+</button>
                                    </div>
                                    <div className="col-span-3 text-right font-mono">
                                        {((item.product.price_cents * item.quantity) / 100).toFixed(2)}€
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <button onClick={() => handleRemove(item.product.id)} className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Totals */}
                    <div className="mt-4 pt-4 border-t space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="font-bold text-xl font-serif text-secondary">Total</span>
                            <span className="font-bold text-2xl font-mono text-primary">{(totalCents / 100).toFixed(2)} €</span>
                        </div>
                        <Button
                            className="w-full mt-4 bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-md"
                            disabled={loading || cart.length === 0}
                            onClick={handleSubmit}
                        >
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                            Créer la Commande
                        </Button>
                    </div>
                </div>
            </div>

            {/* Right Column: Menu Selector */}
            <div className="lg:col-span-1 h-full overflow-hidden flex flex-col rounded-xl border border-border bg-white shadow-sm">
                <div className="p-3 bg-secondary text-white font-serif font-bold text-center">
                    Carte & Menu
                </div>
                <div className="flex-1 overflow-hidden">
                    <ProductSelector products={products} onAdd={handleAddProduct} />
                </div>
            </div>
        </div>
    );
}
