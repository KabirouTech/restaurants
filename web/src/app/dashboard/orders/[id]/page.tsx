import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Printer, Mail, ChefHat } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OrderActions } from "@/components/dashboard/orders/OrderActions";
import { formatPrice } from "@/lib/currencies";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/auth/login");

    // Get Org Info for Invoice Header
    const { data: profile } = await supabase
        .from("profiles")
        .select("*, organizations(name, settings)")
        .eq("id", user.id)
        .single();

    // @ts-ignore
    const org = profile?.organizations;

    // Fetch Order with related data using Service Role (Bypass RLS)
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
    );

    const { data: order, error } = await supabaseAdmin
        .from("orders")
        .select(`
      *,
      customers (*),
      capacity_types (*),
      order_items (
        id,
        quantity,
        unit_price_cents,
        products (name, category)
      )
    `)
        .eq("id", id)
        .single();

    if (error || !order) {
        return <div className="p-8 text-center">Commande introuvable</div>;
    }

    // Handle joins potentially being arrays
    const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
    const capacityType = Array.isArray(order.capacity_types) ? order.capacity_types[0] : order.capacity_types;
    // order_items is definitely array (one to many) - wait, select returns array for One-to-Many by default

    const currency = (org?.settings as any)?.currency || "EUR";
    const subtotal = order.total_amount_cents || 0;
    const total = subtotal; // Tax is 0 for now

    const orgName = org?.name || "Votre Entreprise";
    const orgAddress = org?.settings?.contact_address;
    const orgEmail = org?.settings?.contact_email;
    const orgPhone = org?.settings?.contact_phone;

    return (
        <div className="min-h-screen bg-muted/10 p-6 md:p-8 animate-in fade-in duration-500 print:bg-white print:p-0 print:min-h-0">

            {/* Action Bar (Hidden in Print) */}
            <div className="flex justify-between items-start mb-8 print:hidden flex-wrap gap-4">
                <div>
                    <Link href="/dashboard/orders" className="text-sm text-muted-foreground hover:text-foreground mb-1 block">
                        &larr; Retour aux commandes
                    </Link>
                    <h1 className="text-2xl font-bold font-serif text-foreground">Détail de la Commande</h1>
                </div>

                {/* Client Component for Actions */}
                <div className="flex gap-2">
                    <OrderActions orderId={order.id} customerEmail={customer?.email} currentStatus={order.status} />

                    {/* Could add Edit button linking to /edit later */}
                </div>
            </div>

            {/* Quote / Invoice Paper */}
            <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden print:shadow-none print:max-w-none print:rounded-none print:w-full">

                {/* Header */}
                <div className="p-8 border-b border-border flex justify-between items-start bg-secondary text-white print:text-black print:bg-transparent print:border-b-2 print:border-black print:p-0 print:mb-8 text-black">
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-primary font-serif italic print:text-black">
                            <ChefHat className="h-6 w-6" />
                            <span className="text-lg font-bold">{orgName}</span>
                        </div>
                        <div className="text-sm opacity-80 print:opacity-100 space-y-0.5">
                            {orgAddress ? <p>{orgAddress}</p> : <p className="italic opacity-50">Adresse non configurée</p>}
                            {orgEmail && <p>{orgEmail}</p>}
                            {orgPhone && <p>{orgPhone}</p>}
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-bold mb-1 font-serif uppercase tracking-widest text-white print:text-black">
                            {order.status === 'confirmed' ? 'FACTURE' : 'DEVIS'}
                        </h2>
                        <p className="text-sm opacity-80 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-sm mt-2 opacity-80">
                            Date: {order.event_date ? format(new Date(order.event_date), "dd MMMM yyyy", { locale: fr }) : "Date à définir"}
                        </p>
                    </div>
                </div>

                {/* Client & Event Info */}
                <div className="p-8 grid grid-cols-2 gap-12 border-b border-border/50 print:p-0 print:mb-8 print:gap-4 print:border-none">
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 print:text-black">Client</h3>
                        <p className="font-bold text-lg text-secondary mb-1 print:text-black">{customer?.full_name || "Client Inconnu"}</p>
                        <p className="text-sm text-muted-foreground print:text-black">{customer?.email}</p>
                        <p className="text-sm text-muted-foreground print:text-black">{customer?.phone}</p>
                    </div>
                    <div className="text-right">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 print:text-black">Événement</h3>
                        <p className="font-medium text-foreground mb-1 print:text-black">
                            {capacityType?.name || "Standard"} ({order.guest_count ? `${order.guest_count} pers.` : ""})
                        </p>
                        <p className="text-sm text-muted-foreground print:text-black">
                            Heure: {order.event_time ? order.event_time.slice(0, 5) : "Non définie"}
                        </p>
                    </div>
                </div>

                {/* Items Table */}
                <div className="p-8 print:p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b-2 border-secondary/10 hover:border-b-2 print:border-black">
                                <TableHead className="w-[50%] text-secondary font-bold text-left pl-0 print:text-black">Désignation</TableHead>
                                <TableHead className="text-right text-secondary font-bold print:text-black">P.U.</TableHead>
                                <TableHead className="text-center text-secondary font-bold print:text-black">Qté</TableHead>
                                <TableHead className="text-right text-secondary font-bold pr-0 print:text-black">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {order.order_items && order.order_items.length > 0 ? (
                                order.order_items.map((item: any) => (
                                    <TableRow key={item.id} className="hover:bg-transparent border-b border-border/50 hover:border-border/50 print:border-gray-200">
                                        <TableCell className="font-medium py-4 pl-0 align-top">
                                            <div className="font-bold text-foreground print:text-black">{item.products?.name || "Article Inconnu"}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5 print:text-gray-600">{item.products?.category}</div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-muted-foreground align-top pt-4 print:text-black">
                                            {formatPrice(item.unit_price_cents, currency)}
                                        </TableCell>
                                        <TableCell className="text-center font-mono align-top pt-4 print:text-black">
                                            {item.quantity}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-medium align-top pt-4 pr-0 text-foreground print:text-black">
                                            {formatPrice(item.unit_price_cents * item.quantity, currency)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        Aucun article dans cette commande.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Totals */}
                <div className="p-8 bg-muted/5 flex justify-end print:bg-transparent print:p-0 print:mt-4">
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between text-sm text-muted-foreground print:text-black">
                            <span>Sous-total HT</span>
                            <span className="font-mono text-foreground print:text-black">{formatPrice(subtotal, currency)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-secondary border-t-2 border-primary pt-3 mt-2 items-baseline print:text-black print:border-black">
                            <span>Total TTC</span>
                            <span className="font-mono text-primary text-2xl print:text-black">{formatPrice(total, currency)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Notes */}
                <div className="p-8 border-t border-border/50 text-xs text-muted-foreground text-center print:border-t-2 print:border-black print:mt-12 print:p-0 print:pt-4">
                    <p className="mb-2 font-medium text-secondary/80 print:text-black">Merci de votre confiance !</p>
                    <p className="opacity-70 print:text-gray-600">
                        Conditions de paiement : 30% à la commande, solde à la livraison.<br />
                        Sauf mention contraire, nos devis sont valables 30 jours.
                    </p>
                </div>
            </div>

            {/* Platform Footer for Print Only */}
            <div className="hidden print:block text-center mt-12 text-[10px] text-gray-400 font-mono">
                Propulsé par Restaurant OS
            </div>
        </div>
    );
}
