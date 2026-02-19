"use client";

import { useState, useEffect } from "react";

import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Loader2, Save, UserPlus, CalendarDays, Plus, Minus, Trash2, Search, ShoppingCart,
} from "lucide-react";
import { createOrderAction } from "@/actions/orders";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Customer = { id: string; full_name: string; email: string; phone: string };
type CapacityType = { id: string; name: string };
type Product = { id: string; name: string; description: string; price_cents: number; category: string };
type CartItem = { product: Product; quantity: number };

interface CalendarQuickOrderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultDate: string;
    customers: Customer[];
    capacityTypes: CapacityType[];
    products: Product[];
}

export function CalendarQuickOrderDialog({
    open, onOpenChange, defaultDate,
    customers = [], capacityTypes = [], products = [],
}: CalendarQuickOrderDialogProps) {

    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Customer
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState("");
    const [newCustomerEmail, setNewCustomerEmail] = useState("");
    const [newCustomerPhone, setNewCustomerPhone] = useState("");

    // Event
    const [eventDate, setEventDate] = useState(defaultDate);
    const [eventTime, setEventTime] = useState("");
    const [capacityTypeId, setCapacityTypeId] = useState("");
    const [guestCount, setGuestCount] = useState<number>(0);
    const [internalNotes, setInternalNotes] = useState("");

    // Cart
    const [cart, setCart] = useState<CartItem[]>([]);
    const [productSearch, setProductSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("Tout");

    const categories = ["Tout", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];
    const filteredProducts = products.filter((p) => {
        const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
        const matchCat = categoryFilter === "Tout" || p.category === categoryFilter;
        return matchSearch && matchCat;
    });

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.product.id === product.id);
            if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { product, quantity: 1 }];
        });
    };
    const updateQty = (id: string, delta: number) => {
        setCart((prev) => prev.map((i) => i.product.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter((i) => i.quantity > 0));
    };
    const removeFromCart = (id: string) => setCart((prev) => prev.filter((i) => i.product.id !== id));

    const totalCents = cart.reduce((acc, i) => acc + i.product.price_cents * i.quantity, 0);

    // Sync the date field every time the dialog opens with a (potentially new) date
    useEffect(() => {
        if (open) {
            setEventDate(defaultDate);
        }
    }, [open, defaultDate]);

    const handleOpenChange = (val: boolean) => {
        if (!val) resetForm();
        onOpenChange(val);
    };


    const resetForm = () => {
        setSelectedCustomerId(""); setIsNewCustomer(false);
        setNewCustomerName(""); setNewCustomerEmail(""); setNewCustomerPhone("");
        setEventTime(""); setCapacityTypeId(""); setGuestCount(0); setInternalNotes("");
        setCart([]); setProductSearch(""); setCategoryFilter("Tout");
    };

    const handleSubmit = async () => {
        if (!isNewCustomer && !selectedCustomerId) { toast.error("Veuillez sélectionner ou créer un client"); return; }
        if (isNewCustomer && !newCustomerName.trim()) { toast.error("Nom du client requis"); return; }
        if (!eventDate || !capacityTypeId) { toast.error("Date et type de prestation requis"); return; }

        setLoading(true);
        const result = await createOrderAction({
            customerId: isNewCustomer ? null : selectedCustomerId,
            customerName: isNewCustomer ? newCustomerName : undefined,
            customerEmail: isNewCustomer ? newCustomerEmail : undefined,
            customerPhone: isNewCustomer ? newCustomerPhone : undefined,
            eventDate,
            eventTime: eventTime || null,
            guestCount, capacityTypeId, internalNotes,
            totalAmountCents: totalCents,
            items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity, unitPriceCents: i.product.price_cents })),
        });
        setLoading(false);

        if (result.error) { toast.error(result.error); return; }
        toast.success("Devis créé avec succès !");
        onOpenChange(false);
        resetForm();
        router.refresh();
    };

    const displayDate = eventDate ? format(new Date(eventDate + "T00:00:00"), "EEEE d MMMM yyyy", { locale: fr }) : "";

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-4xl w-full gap-0 p-0 overflow-hidden h-[90vh] flex flex-col">

                {/* Header */}
                <DialogHeader className="px-6 pt-5 pb-4 bg-primary/5 border-b border-border shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-secondary font-serif text-lg">
                        <CalendarDays className="h-5 w-5 text-primary" />
                        Nouveau Devis
                    </DialogTitle>
                    {displayDate && <p className="text-sm text-primary font-medium capitalize">{displayDate}</p>}
                </DialogHeader>

                {/* Body — two columns */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ── LEFT: form ────────────────────────────────── */}
                    <div className="w-[52%] border-r border-border flex flex-col overflow-y-auto">
                        <div className="p-5 space-y-4 flex-1">

                            {/* Client */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Client</Label>
                                {!isNewCustomer ? (
                                    <div className="flex gap-2">
                                        <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                            <SelectTrigger className="flex-1 h-9 text-sm">
                                                <SelectValue placeholder="Sélectionner un client..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {customers.map((c) => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.full_name}{c.phone ? ` — ${c.phone}` : ""}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setIsNewCustomer(true)} title="Nouveau client">
                                            <UserPlus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2 bg-primary/5 p-3 rounded-lg border border-dashed border-primary/30 animate-in slide-in-from-left duration-300">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-semibold text-primary">Nouveau client</span>
                                            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setIsNewCustomer(false)}>Annuler</Button>
                                        </div>
                                        <Input placeholder="Nom Complet *" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} className="h-8 text-sm" />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input placeholder="Email" value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} className="h-8 text-sm" />
                                            <Input placeholder="Téléphone" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} className="h-8 text-sm" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</Label>
                                    <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="h-9 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Heure (opt.)</Label>
                                    <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="h-9 text-sm" />
                                </div>
                            </div>

                            {/* Capacity Type & Guests */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type de Prestation</Label>
                                    <Select value={capacityTypeId} onValueChange={setCapacityTypeId} disabled={capacityTypes.length === 0}>
                                        <SelectTrigger className="h-9 text-sm">
                                            <SelectValue placeholder={capacityTypes.length === 0 ? "Aucun type" : "Sélectionner..."} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {capacityTypes.map((ct) => <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invités</Label>
                                    <Input type="number" min="0" value={guestCount} onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)} className="h-9 text-sm" />
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes Internes</Label>
                                <Textarea placeholder="Allergies, adresse, préférences..." className="resize-none h-16 text-sm" value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
                            </div>

                            {/* Cart summary */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                                    <ShoppingCart className="h-3.5 w-3.5" /> Panier ({cart.length} article{cart.length > 1 ? "s" : ""})
                                </Label>
                                {cart.length === 0 ? (
                                    <div className="border-2 border-dashed border-muted/60 rounded-lg py-4 text-center text-sm text-muted-foreground">
                                        Sélectionnez des articles dans la carte →
                                    </div>
                                ) : (
                                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                        {cart.map((item) => (
                                            <div key={item.product.id} className="flex items-center justify-between gap-2 text-sm py-1.5 px-2 rounded-md hover:bg-muted/30 group">
                                                <span className="flex-1 font-medium truncate">{item.product.name}</span>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button onClick={() => updateQty(item.product.id, -1)} className="h-5 w-5 rounded bg-muted flex items-center justify-center hover:bg-muted/70">
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="w-5 text-center font-mono text-xs">{item.quantity}</span>
                                                    <button onClick={() => updateQty(item.product.id, 1)} className="h-5 w-5 rounded bg-muted flex items-center justify-center hover:bg-muted/70">
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                <span className="font-mono text-xs w-14 text-right">{((item.product.price_cents * item.quantity) / 100).toFixed(2)}€</span>
                                                <button onClick={() => removeFromCart(item.product.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Total */}
                        <div className="mx-5 mb-3 pt-3 border-t border-border flex justify-between items-center">
                            <span className="text-sm font-semibold text-muted-foreground">Total</span>
                            <span className="font-mono font-bold text-xl text-primary">{(totalCents / 100).toFixed(2)} €</span>
                        </div>
                    </div>

                    {/* ── RIGHT: product catalogue ───────────────────── */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-muted/10">
                        {/* Search + categories */}
                        <div className="p-3 border-b border-border space-y-2 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Rechercher un plat..." className="pl-9 h-9 bg-white text-sm" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
                            </div>
                            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoryFilter(cat)}
                                        className={cn(
                                            "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-colors shrink-0",
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

                        {/* Product list */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {filteredProducts.length === 0 ? (
                                <div className="text-center py-10 text-sm text-muted-foreground">Aucun résultat</div>
                            ) : filteredProducts.map((product) => {
                                const inCart = cart.find((i) => i.product.id === product.id);
                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className={cn(
                                            "flex items-center justify-between gap-2 p-2.5 rounded-lg cursor-pointer transition-all border",
                                            inCart
                                                ? "bg-primary/5 border-primary/30"
                                                : "bg-white border-transparent hover:border-border hover:bg-white"
                                        )}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{product.name}</p>
                                            <p className="text-xs text-muted-foreground">{product.category}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="font-mono text-sm font-semibold">{(product.price_cents / 100).toFixed(2)}€</span>
                                            {inCart ? (
                                                <span className="h-6 w-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">
                                                    {inCart.quantity}
                                                </span>
                                            ) : (
                                                <span className="h-6 w-6 rounded-full border border-dashed border-primary/40 text-primary/50 text-lg flex items-center justify-center leading-none">
                                                    +
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex-row justify-between gap-2 shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 text-white font-semibold gap-2 min-w-[160px]">
                        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Création...</> : <><Save className="h-4 w-4" /> Créer le Devis</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
