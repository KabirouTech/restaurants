"use client";

import { useState, useTransition } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, MoreHorizontal, Edit, Trash, Phone, Mail, FileSpreadsheet, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createCustomerAction, updateCustomerAction, deleteCustomerAction, bulkDeleteCustomersAction } from "@/actions/customers";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { ImportCustomersDialog } from "./ImportCustomersDialog";

type Customer = {
    id: string;
    organization_id: string;
    full_name: string;
    email: string;
    phone: string;
    source?: string;
    notes?: string;
    created_at?: string;
};

const SOURCE_ICONS: Record<string, string> = {
    whatsapp: "💬",
    instagram: "📸",
    email: "✉️",
    phone: "📞",
    website: "🌐",
    other: "•",
};

function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = [
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
];
function avatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function CustomersTable({ initialCustomers }: { initialCustomers: Customer[] }) {
    const router = useRouter();
    const [view, setView] = useState<ViewMode>("list");
    const [filter, setFilter] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(false);
    const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [isBulkDeleting, startBulkDelete] = useTransition();

    const filteredCustomers = initialCustomers.filter((c) =>
        c.full_name.toLowerCase().includes(filter.toLowerCase()) ||
        (c.email || "").toLowerCase().includes(filter.toLowerCase()) ||
        (c.phone || "").toLowerCase().includes(filter.toLowerCase())
    );

    const allSelected = filteredCustomers.length > 0 && filteredCustomers.every(c => selectedIds.has(c.id));
    const someSelected = filteredCustomers.some(c => selectedIds.has(c.id));

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredCustomers.map(c => c.id)));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleOpenCreate = () => { setEditingCustomer(null); setIsDialogOpen(true); };
    const handleOpenEdit = (customer: Customer) => { setEditingCustomer(customer); setIsDialogOpen(true); };

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        try {
            if (editingCustomer) {
                formData.append("id", editingCustomer.id);
                const result = await updateCustomerAction(formData);
                if (result.error) toast.error(result.error);
                else { toast.success("Client mis à jour !"); setIsDialogOpen(false); router.refresh(); }
            } else {
                const result = await createCustomerAction(formData);
                if (result.error) toast.error(result.error);
                else { toast.success("Client créé !"); setIsDialogOpen(false); router.refresh(); }
            }
        } catch { toast.error("Erreur inattendue."); }
        finally { setLoading(false); }
    };

    const handleDeleteConfirmed = async () => {
        if (!deletingCustomer) return;
        setLoading(true);
        try {
            const result = await deleteCustomerAction(deletingCustomer.id);
            if (result.error) toast.error(result.error);
            else { toast.success(`"${deletingCustomer.full_name}" supprimé.`); setDeletingCustomer(null); router.refresh(); }
        } finally { setLoading(false); }
    };

    const handleBulkDelete = () => {
        startBulkDelete(async () => {
            const ids = Array.from(selectedIds);
            const result = await bulkDeleteCustomersAction(ids);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`${result.count} client(s) supprimé(s).`);
                setSelectedIds(new Set());
                setIsBulkDeleteOpen(false);
                router.refresh();
            }
        });
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un client..."
                        className="pl-8"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 ml-auto">
                    {/* Bulk action bar */}
                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 border border-destructive/20 rounded-lg animate-in slide-in-from-right-4 duration-200">
                            <span className="text-sm font-medium text-destructive">{selectedIds.size} sélectionné(s)</span>
                            <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 gap-1.5 text-xs"
                                onClick={() => setIsBulkDeleteOpen(true)}
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Supprimer
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedIds(new Set())}>
                                Annuler
                            </Button>
                        </div>
                    )}
                    <ViewToggle view={view} onChange={setView} />
                    <Button variant="outline" onClick={() => setIsImportOpen(true)} className="gap-2">
                        <FileSpreadsheet className="h-4 w-4" /> Importer Excel
                    </Button>
                    <Button onClick={handleOpenCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Nouveau Client
                    </Button>
                </div>
            </div>

            {filteredCustomers.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
                    Aucun client trouvé.
                </div>
            ) : (
                <>
                    {/* ── LIST / TABLE VIEW ─────────────────────────────────── */}
                    {view === "list" && (
                        <div className="rounded-md border bg-card shadow-sm animate-in fade-in duration-300">
                            <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/80 hover:bg-muted/80">
                                            <TableHead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm w-10">
                                                <Checkbox
                                                    checked={allSelected}
                                                    onCheckedChange={toggleSelectAll}
                                                    aria-label="Tout sélectionner"
                                                    data-state={!allSelected && someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                                                />
                                            </TableHead>
                                            <TableHead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm font-semibold">Nom Complet</TableHead>
                                            <TableHead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm font-semibold">Email</TableHead>
                                            <TableHead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm font-semibold">Téléphone</TableHead>
                                            <TableHead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm font-semibold">Source</TableHead>
                                            <TableHead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm font-semibold text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredCustomers.map((customer) => (
                                            <TableRow
                                                key={customer.id}
                                                className={cn("hover:bg-muted/5 group", selectedIds.has(customer.id) && "bg-primary/5")}
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedIds.has(customer.id)}
                                                        onCheckedChange={() => toggleSelect(customer.id)}
                                                        aria-label={`Sélectionner ${customer.full_name}`}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn("h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0", avatarColor(customer.full_name))}>
                                                            {getInitials(customer.full_name)}
                                                        </span>
                                                        {customer.full_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{customer.email || "-"}</TableCell>
                                                <TableCell className="text-muted-foreground">{customer.phone || "-"}</TableCell>
                                                <TableCell>
                                                    {customer.source && (
                                                        <Badge variant="secondary" className="uppercase text-[10px]">
                                                            {SOURCE_ICONS[customer.source] || ""} {customer.source}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Actions</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => handleOpenEdit(customer)}>
                                                                <Edit className="mr-2 h-4 w-4" /> Modifier
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => setDeletingCustomer(customer)}
                                                                className="text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash className="mr-2 h-4 w-4" /> Supprimer
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {/* ── GRID / CARD VIEW ──────────────────────────────────── */}
                    {view === "grid" && (
                        <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-300 pb-2">
                                {filteredCustomers.map((customer) => (
                                    <div
                                        key={customer.id}
                                        className={cn(
                                            "group relative bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all",
                                            selectedIds.has(customer.id) && "ring-2 ring-primary border-primary"
                                        )}
                                    >
                                        {/* Checkbox */}
                                        <div className="absolute top-3 left-3">
                                            <Checkbox
                                                checked={selectedIds.has(customer.id)}
                                                onCheckedChange={() => toggleSelect(customer.id)}
                                                aria-label={`Sélectionner ${customer.full_name}`}
                                                className="opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 transition-opacity"
                                            />
                                        </div>
                                        {/* Actions */}
                                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-secondary" onClick={() => handleOpenEdit(customer)}>
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeletingCustomer(customer)}>
                                                <Trash className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>

                                        {/* Avatar + Name */}
                                        <div className="flex flex-col items-center text-center mb-4 pt-4">
                                            <div className={cn("h-14 w-14 rounded-full flex items-center justify-center text-xl font-bold mb-3", avatarColor(customer.full_name))}>
                                                {getInitials(customer.full_name)}
                                            </div>
                                            <h3 className="font-semibold text-secondary text-sm leading-tight">{customer.full_name}</h3>
                                            {customer.source && (
                                                <Badge variant="secondary" className="mt-1.5 text-[10px]">
                                                    {SOURCE_ICONS[customer.source] || ""} {customer.source}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Contact info */}
                                        <div className="space-y-1.5 text-xs text-muted-foreground">
                                            {customer.email && (
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <Mail className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">{customer.email}</span>
                                                </div>
                                            )}
                                            {customer.phone && (
                                                <div className="flex items-center gap-1.5">
                                                    <Phone className="h-3 w-3 shrink-0" />
                                                    <span>{customer.phone}</span>
                                                </div>
                                            )}
                                            {customer.notes && (
                                                <p className="mt-2 text-[11px] line-clamp-2 italic text-muted-foreground/70 border-t border-border pt-2">
                                                    {customer.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Create/Edit Modal */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCustomer ? "Modifier le Client" : "Nouveau Client"}</DialogTitle>
                    </DialogHeader>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="full_name">Nom Complet</Label>
                            <Input id="full_name" name="full_name" required defaultValue={editingCustomer?.full_name} placeholder="Ex: Jean Dupont" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={editingCustomer?.email} placeholder="jean@example.com" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Téléphone</Label>
                                <Input id="phone" name="phone" type="tel" defaultValue={editingCustomer?.phone} placeholder="06 12 34 56 78" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="source">Source de contact</Label>
                            <Select name="source" defaultValue={editingCustomer?.source || "other"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner une source" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                                    <SelectItem value="instagram">📸 Instagram</SelectItem>
                                    <SelectItem value="email">✉️ Email</SelectItem>
                                    <SelectItem value="phone">📞 Téléphone</SelectItem>
                                    <SelectItem value="website">🌐 Site Web</SelectItem>
                                    <SelectItem value="other">• Autre</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" name="notes" placeholder="Préférences, allergies, historique..." defaultValue={editingCustomer?.notes || ""} className="resize-none h-20" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Enregistrement..." : "Enregistrer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Single Delete Confirmation */}
            <ConfirmDialog
                open={!!deletingCustomer}
                onOpenChange={(open) => { if (!open) setDeletingCustomer(null); }}
                title="Supprimer ce client ?"
                description={`"${deletingCustomer?.full_name}" et toutes ses données seront définitivement supprimés. Cette action est irréversible.`}
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                variant="destructive"
                onConfirm={handleDeleteConfirmed}
            />

            {/* Bulk Delete Confirmation */}
            <ConfirmDialog
                open={isBulkDeleteOpen}
                onOpenChange={setIsBulkDeleteOpen}
                title={`Supprimer ${selectedIds.size} client(s) ?`}
                description={`Ces ${selectedIds.size} clients seront définitivement supprimés. Cette action est irréversible.`}
                confirmLabel={isBulkDeleting ? "Suppression..." : `Supprimer ${selectedIds.size} client(s)`}
                cancelLabel="Annuler"
                variant="destructive"
                onConfirm={handleBulkDelete}
            />

            {/* Import Dialog */}
            <ImportCustomersDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
        </div>
    );
}
