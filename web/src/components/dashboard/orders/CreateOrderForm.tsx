"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Trash2, UserPlus, Loader2, Save, ClipboardList, UtensilsCrossed, ArrowLeft } from "lucide-react";
import { createOrderAction } from "@/actions/orders";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ProductSelector } from "./ProductSelector";
import { formatPrice } from "@/lib/currencies";
import { useTranslations } from "next-intl";

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
    currency?: string;
}

export function CreateOrderForm({ products, capacityTypes, customers, currency = "EUR" }: CreateOrderFormProps) {
    const t = useTranslations("dashboard.orders.form");
    const tc = useTranslations("common");
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [mobilePanel, setMobilePanel] = useState<"form" | "menu">("form");

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState("");
    const [newCustomerEmail, setNewCustomerEmail] = useState("");
    const [newCustomerPhone, setNewCustomerPhone] = useState("");

    const [eventDate, setEventDate] = useState(searchParams.get("date") || "");
    const [eventTime, setEventTime] = useState(searchParams.get("time") || "");
    const [guestCount, setGuestCount] = useState(0);
    const [capacityTypeId, setCapacityTypeId] = useState<string>("");
    const [internalNotes, setInternalNotes] = useState("");

    const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);

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

    const totalCents = cart.reduce((acc, item) => acc + (item.product.price_cents * item.quantity), 0);

    const handleSubmit = async () => {
        if (!isNewCustomer && !selectedCustomerId) {
            toast.error(t('selectClientError'));
            return;
        }
        if (isNewCustomer && !newCustomerName) {
            toast.error(t('clientNameRequired'));
            return;
        }
        if (!eventDate || !capacityTypeId) {
            toast.error(t('dateAndTypeRequired'));
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
            toast.success(t('orderCreated'));
            router.push("/dashboard/orders");
        }
        setLoading(false);
    };

    // ─── Shared form panels ─────────────────────────────────────────────────

    const EventForm = (
        <div className="bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h3 className="font-serif text-base md:text-lg font-bold text-foreground border-b pb-2 mb-4">
                {t('clientAndEvent')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                    <Label>{t('client')}</Label>
                    {!isNewCustomer ? (
                        <div className="flex gap-2">
                            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('selectClient')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.full_name} ({c.phone || tc('noPhone')})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="icon" onClick={() => setIsNewCustomer(true)} title={t('newClient')}>
                                <UserPlus className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2 bg-muted/20 p-3 rounded-lg border border-dashed border-primary/30 animate-in slide-in-from-left duration-300">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-semibold text-primary">{t('newClient')}</span>
                                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setIsNewCustomer(false)}>
                                    {tc('cancel')}
                                </Button>
                            </div>
                            <Input placeholder={t('fullName')} value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} className="h-8 text-sm" />
                            <div className="grid grid-cols-2 gap-2">
                                <Input placeholder={tc('email')} value={newCustomerEmail} onChange={e => setNewCustomerEmail(e.target.value)} className="h-8 text-sm" />
                                <Input placeholder={tc('phone')} value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} className="h-8 text-sm" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Date & Time */}
                <div className="col-span-2 md:col-span-1">
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                        <div className="space-y-2">
                            <Label>{t('eventDate')}</Label>
                            <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="h-9 text-sm" />
                        </div>
                        <div className="space-y-2 w-24">
                            <Label>{t('time')}</Label>
                            <Input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} className="h-9 text-sm" />
                        </div>
                    </div>
                </div>

                {/* Capacity type & Guests */}
                <div className="col-span-2 md:col-span-1">
                    <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>{t('serviceType')}</Label>
                                {capacityTypes.length === 0 && (
                                    <span className="text-xs text-red-500 font-medium animate-pulse">
                                        <Link href="/dashboard/settings?tab=capacity" className="underline hover:text-red-700">
                                            {tc('configure')}
                                        </Link>
                                    </span>
                                )}
                            </div>
                            <Select value={capacityTypeId} onValueChange={setCapacityTypeId} disabled={capacityTypes.length === 0}>
                                <SelectTrigger className="h-9 text-sm">
                                    <SelectValue placeholder={capacityTypes.length === 0 ? t('noType') : t('selectPlaceholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {capacityTypes.map(ct => (
                                        <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 w-20">
                            <Label>{t('guestsLabel')}</Label>
                            <Input type="number" min="0" value={guestCount} onChange={e => setGuestCount(parseInt(e.target.value) || 0)} className="h-9 text-sm" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <Label>{t('internalNotes')}</Label>
                <Textarea
                    placeholder={t('notesPlaceholder')}
                    className="resize-none h-20 mt-1.5"
                    value={internalNotes}
                    onChange={e => setInternalNotes(e.target.value)}
                />
            </div>
        </div>
    );

    const CartPanel = (
        <div className="bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm flex flex-col">
            <h3 className="font-serif text-base md:text-lg font-bold text-foreground border-b pb-2 mb-4 flex justify-between items-center">
                <span>{t('orderDetail')}</span>
                <span className="text-sm font-sans font-medium text-muted-foreground">{cart.length} articles</span>
            </h3>

            {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-muted-foreground py-6 border-2 border-dashed border-muted/50 rounded-lg">
                    <p className="text-sm">{t('cartEmpty')}</p>
                    <p className="text-xs mt-1">{t('cartEmptyHint')}</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    <div className="grid grid-cols-12 text-xs font-semibold text-muted-foreground uppercase pb-2 border-b mb-2 px-2">
                        <div className="col-span-6">{tc('article')}</div>
                        <div className="col-span-2 text-center">{tc('quantity')}</div>
                        <div className="col-span-3 text-right">{tc('price')}</div>
                        <div className="col-span-1"></div>
                    </div>
                    {cart.map(item => (
                        <div key={item.product.id} className="grid grid-cols-12 items-center text-sm py-2 px-2 hover:bg-muted/10 rounded group">
                            <div className="col-span-6 font-medium truncate pr-2 text-xs md:text-sm" title={item.product.name}>
                                {item.product.name}
                            </div>
                            <div className="col-span-2 flex justify-center items-center gap-0.5 md:gap-1">
                                <button onClick={() => handleUpdateQuantity(item.product.id, -1)} className="hover:bg-muted rounded px-1 text-base leading-none">-</button>
                                <span className="w-5 text-center text-xs">{item.quantity}</span>
                                <button onClick={() => handleUpdateQuantity(item.product.id, 1)} className="hover:bg-muted rounded px-1 text-base leading-none">+</button>
                            </div>
                            <div className="col-span-3 text-right font-mono text-xs md:text-sm">
                                {formatPrice(item.product.price_cents * item.quantity, currency)}
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <button onClick={() => handleRemove(item.product.id)} className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Totals — desktop only, mobile has sticky bar */}
            <div className="mt-4 pt-4 border-t hidden md:block">
                <div className="flex justify-between items-end mb-4">
                    <span className="font-bold text-xl font-serif text-foreground">{tc('total')}</span>
                    <span className="font-bold text-2xl font-mono text-primary">{formatPrice(totalCents, currency)}</span>
                </div>
                <Button
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-md"
                    disabled={loading}
                    onClick={handleSubmit}
                >
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                    {t('createOrder')}
                </Button>
            </div>
        </div>
    );

    // ─── MOBILE LAYOUT ──────────────────────────────────────────────────────
    return (
        <>
            {/* ── MOBILE ── */}
            <div className="md:hidden flex flex-col h-full pb-[80px]">
                {/* Tab switcher */}
                <div className="flex items-center bg-card border border-border rounded-xl p-1 mb-4 gap-1 shrink-0">
                    <button
                        onClick={() => setMobilePanel("form")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all",
                            mobilePanel === "form"
                                ? "bg-primary text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <ClipboardList className="h-4 w-4" />
                        {t('infos')}
                    </button>
                    <button
                        onClick={() => setMobilePanel("menu")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all",
                            mobilePanel === "menu"
                                ? "bg-primary text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <UtensilsCrossed className="h-4 w-4" />
                        {t('menu')}
                        {cart.length > 0 && (
                            <span className="w-5 h-5 rounded-full bg-white text-primary text-[10px] font-bold flex items-center justify-center">
                                {cart.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Panel content */}
                <div className="flex-1 overflow-y-auto space-y-4">
                    {mobilePanel === "form" ? (
                        <>
                            {EventForm}
                            {CartPanel}
                        </>
                    ) : (
                        <div className="rounded-xl border border-border bg-card overflow-hidden h-[calc(100vh-280px)]">
                            <div className="p-3 bg-secondary text-white font-serif font-bold text-center text-sm">
                                {t('menuAndDishes')}
                            </div>
                            <div className="h-[calc(100%-44px)] overflow-hidden">
                                <ProductSelector products={products} onAdd={handleAddProduct} currency={currency} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Sticky FAB submit bar */}
                <div className="fixed bottom-[64px] left-0 right-0 z-40 bg-card/95 backdrop-blur border-t border-border px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{tc('total')}</p>
                            <p className="font-bold font-mono text-primary text-lg leading-tight">
                                {formatPrice(totalCents, currency)}
                            </p>
                        </div>
                        <Button
                            className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-5 rounded-xl shadow-md shadow-primary/20 shrink-0"
                            disabled={loading}
                            onClick={handleSubmit}
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    {t('createOrder')}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── DESKTOP ── */}
            <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-8rem)]">
                {/* Left: Form + Cart */}
                <div className="lg:col-span-2 flex flex-col gap-6 lg:overflow-y-auto lg:pr-2">
                    {EventForm}
                    {CartPanel}
                </div>

                {/* Right: Product Selector */}
                <div className="lg:col-span-1 lg:h-full min-h-[400px] overflow-hidden flex flex-col rounded-xl border border-border bg-card shadow-sm">
                    <div className="p-3 bg-secondary text-white font-serif font-bold text-center">
                        {t('menuAndDishes')}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <ProductSelector products={products} onAdd={handleAddProduct} currency={currency} />
                    </div>
                </div>
            </div>
        </>
    );
}
