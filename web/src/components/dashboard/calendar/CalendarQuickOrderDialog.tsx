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
    ClipboardList, UtensilsCrossed,
} from "lucide-react";
import { createOrderAction } from "@/actions/orders";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currencies";
import { useTranslations } from "next-intl";

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
    currency: string;
}

export function CalendarQuickOrderDialog({
    open, onOpenChange, defaultDate,
    customers = [], capacityTypes = [], products = [], currency,
}: CalendarQuickOrderDialogProps) {

    const t = useTranslations("dashboard.calendar.dialog");
    const tc = useTranslations("common");
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
    const [categoryFilter, setCategoryFilter] = useState("__all__");

    // Mobile tabs
    const [mobileTab, setMobileTab] = useState<"form" | "menu">("form");

    const categories = ["__all__", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];
    const filteredProducts = products.filter((p) => {
        const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
        const matchCat = categoryFilter === "__all__" || p.category === categoryFilter;
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
        setCart([]); setProductSearch(""); setCategoryFilter("__all__"); setMobileTab("form");
    };

    const handleSubmit = async () => {
        if (!isNewCustomer && !selectedCustomerId) { toast.error(t('selectClientError')); return; }
        if (isNewCustomer && !newCustomerName.trim()) { toast.error(t('clientNameRequired')); return; }
        if (!eventDate || !capacityTypeId) { toast.error(t('dateAndTypeRequired')); return; }

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
        toast.success(t('quoteCreated'));
        onOpenChange(false);
        resetForm();
        router.refresh();
    };

    const displayDate = eventDate ? format(new Date(eventDate + "T00:00:00"), "EEEE d MMMM yyyy", { locale: fr }) : "";

    /* ── Shared sub-components ─────────────────────────────────────────── */

    const formPanel = (
        <div className="p-4 sm:p-5 space-y-4 flex-1">
            {/* Client */}
            <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('client')}</Label>
                {!isNewCustomer ? (
                    <div className="flex gap-2">
                        <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                            <SelectTrigger className="flex-1 h-9 text-sm">
                                <SelectValue placeholder={t('selectClient')} />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.full_name}{c.phone ? ` — ${c.phone}` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => setIsNewCustomer(true)} title={t('newClient')}>
                            <UserPlus className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2 bg-primary/5 p-3 rounded-lg border border-dashed border-primary/30 animate-in slide-in-from-left duration-300">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-primary">{t('newClient')}</span>
                            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setIsNewCustomer(false)}>{tc('cancel')}</Button>
                        </div>
                        <Input placeholder={`${tc('name')} *`} value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} className="h-8 text-sm" />
                        <div className="grid grid-cols-2 gap-2">
                            <Input placeholder={tc('email')} value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} className="h-8 text-sm" />
                            <Input placeholder={tc('phone')} value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} className="h-8 text-sm" />
                        </div>
                    </div>
                )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('date')}</Label>
                    <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5 w-24">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('time')}</Label>
                    <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="h-9 text-sm" />
                </div>
            </div>

            {/* Capacity Type & Guests */}
            <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('serviceType')}</Label>
                    <Select value={capacityTypeId} onValueChange={setCapacityTypeId} disabled={capacityTypes.length === 0}>
                        <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder={capacityTypes.length === 0 ? t('noType') : t('selectPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {capacityTypes.map((ct) => <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5 w-20">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('guestsLabel')}</Label>
                    <Input type="number" min="0" value={guestCount} onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)} className="h-9 text-sm" />
                </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('internalNotes')}</Label>
                <Textarea placeholder={t('notesPlaceholder')} className="resize-none h-16 text-sm" value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
            </div>

            {/* Cart summary */}
            <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <ShoppingCart className="h-3.5 w-3.5" /> {t('cart')} ({t('articleCount', { count: cart.length })})
                </Label>
                {cart.length === 0 ? (
                    <button
                        type="button"
                        onClick={() => setMobileTab("menu")}
                        className="sm:pointer-events-none w-full border-2 border-dashed border-muted/60 rounded-lg py-4 text-center text-sm text-muted-foreground"
                    >
                        <span className="hidden sm:inline">{t('selectItemsHint')}</span>
                        <span className="sm:hidden text-primary font-medium">{t('addItemsMobile')}</span>
                    </button>
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
                                <span className="font-mono text-xs w-14 text-right">{formatPrice(item.product.price_cents * item.quantity, currency)}</span>
                                <button onClick={() => removeFromCart(item.product.id)} className="text-destructive sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const menuPanel = (
        <div className="flex-1 flex flex-col overflow-hidden bg-muted/10">
            {/* Search + categories */}
            <div className="p-3 border-b border-border space-y-2 shrink-0">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t('searchDish')} className="pl-9 h-9 bg-card text-sm" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
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
                                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                            )}
                        >
                            {cat === "__all__" ? tc('all') : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-10 text-sm text-muted-foreground">{t('noResults')}</div>
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
                                    : "bg-card border-transparent hover:border-border hover:bg-card"
                            )}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{product.name}</p>
                                <p className="text-xs text-muted-foreground">{product.category}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono text-sm font-semibold">{formatPrice(product.price_cents, currency)}</span>
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
    );

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-4xl w-full gap-0 p-0 overflow-hidden h-[90dvh] flex flex-col">

                {/* Header */}
                <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 bg-primary/5 border-b border-border shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-foreground font-serif text-base sm:text-lg">
                        <CalendarDays className="h-5 w-5 text-primary" />
                        {t('newQuote')}
                    </DialogTitle>
                    {displayDate && <p className="text-sm text-primary font-medium capitalize">{displayDate}</p>}
                </DialogHeader>

                {/* ── MOBILE: Tab switcher ──────────────────────── */}
                <div className="sm:hidden flex items-center bg-muted/30 border-b border-border p-1.5 gap-1 shrink-0">
                    <button
                        onClick={() => setMobileTab("form")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all",
                            mobileTab === "form"
                                ? "bg-primary text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <ClipboardList className="h-4 w-4" />
                        {t('infos')}
                    </button>
                    <button
                        onClick={() => setMobileTab("menu")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all",
                            mobileTab === "menu"
                                ? "bg-primary text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <UtensilsCrossed className="h-4 w-4" />
                        {t('menu')}
                        {cart.length > 0 && (
                            <span className={cn(
                                "w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center",
                                mobileTab === "menu"
                                    ? "bg-white text-primary"
                                    : "bg-primary text-white"
                            )}>
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* ── MOBILE: Tab content ───────────────────────── */}
                <div className="sm:hidden flex-1 flex flex-col overflow-hidden">
                    {mobileTab === "form" ? (
                        <div className="flex-1 overflow-y-auto flex flex-col">
                            {formPanel}
                        </div>
                    ) : (
                        menuPanel
                    )}
                </div>

                {/* ── DESKTOP: Two-column layout ───────────────── */}
                <div className="hidden sm:flex flex-1 overflow-hidden">
                    <div className="w-[52%] border-r border-border flex flex-col overflow-y-auto">
                        {formPanel}
                        {/* Total */}
                        <div className="mx-5 mb-3 pt-3 border-t border-border flex justify-between items-center">
                            <span className="text-sm font-semibold text-muted-foreground">{tc('total')}</span>
                            <span className="font-mono font-bold text-xl text-primary">{formatPrice(totalCents, currency)}</span>
                        </div>
                    </div>
                    {menuPanel}
                </div>

                {/* ── MOBILE: Sticky footer with total + submit ── */}
                <div className="sm:hidden px-4 py-3 border-t border-border bg-card/95 backdrop-blur shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{tc('total')}</p>
                            <p className="font-bold font-mono text-primary text-lg leading-tight">
                                {formatPrice(totalCents, currency)}
                            </p>
                        </div>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-white font-semibold gap-2 h-11 px-5 rounded-xl shadow-md shadow-primary/20 shrink-0"
                        >
                            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('creating')}</> : <><Save className="h-4 w-4" /> {t('createQuote')}</>}
                        </Button>
                    </div>
                </div>

                {/* ── DESKTOP: Footer ──────────────────────────── */}
                <DialogFooter className="hidden sm:flex px-6 py-4 border-t border-border bg-muted/20 flex-row justify-between gap-2 shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{tc('cancel')}</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 text-white font-semibold gap-2 min-w-[160px]">
                        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('creating')}</> : <><Save className="h-4 w-4" /> {t('createQuote')}</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
