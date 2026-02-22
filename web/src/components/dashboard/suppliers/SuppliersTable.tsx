"use client";

import { useState, useTransition } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, MoreHorizontal, Edit, Trash, Phone, Mail, MapPin, Trash2, FileSpreadsheet } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createSupplierAction, updateSupplierAction, deleteSupplierAction, bulkDeleteSuppliersAction } from "@/actions/suppliers";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { ImportSuppliersDialog } from "./ImportSuppliersDialog";

type Supplier = {
    id: string;
    organization_id: string;
    name: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
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

export function SuppliersTable({ suppliers }: { suppliers: Supplier[] }) {
    const router = useRouter();
    const [view, setView] = useState<ViewMode>("list");
    const [filter, setFilter] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [loading, setLoading] = useState(false);
    const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [isBulkDeleting, startBulkDelete] = useTransition();

    const filteredSuppliers = suppliers.filter((s) =>
        s.name.toLowerCase().includes(filter.toLowerCase()) ||
        (s.contact_name || "").toLowerCase().includes(filter.toLowerCase()) ||
        (s.email || "").toLowerCase().includes(filter.toLowerCase()) ||
        (s.phone || "").toLowerCase().includes(filter.toLowerCase())
    );

    const allSelected = filteredSuppliers.length > 0 && filteredSuppliers.every(s => selectedIds.has(s.id));
    const someSelected = filteredSuppliers.some(s => selectedIds.has(s.id));

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredSuppliers.map(s => s.id)));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleOpenCreate = () => { setEditingSupplier(null); setIsDialogOpen(true); };
    const handleOpenEdit = (supplier: Supplier) => { setEditingSupplier(supplier); setIsDialogOpen(true); };

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        try {
            if (editingSupplier) {
                formData.append("id", editingSupplier.id);
                const result = await updateSupplierAction(formData);
                if (result.error) toast.error(result.error);
                else { toast.success("Fournisseur mis à jour !"); setIsDialogOpen(false); router.refresh(); }
            } else {
                const result = await createSupplierAction(formData);
                if (result.error) toast.error(result.error);
                else { toast.success("Fournisseur créé !"); setIsDialogOpen(false); router.refresh(); }
            }
        } catch { toast.error("Erreur inattendue."); }
        finally { setLoading(false); }
    };

    const handleDeleteConfirmed = async () => {
        if (!deletingSupplier) return;
        setLoading(true);
        try {
            const result = await deleteSupplierAction(deletingSupplier.id);
            if (result.error) toast.error(result.error);
            else { toast.success(`"${deletingSupplier.name}" supprimé.`); setDeletingSupplier(null); router.refresh(); }
        } finally { setLoading(false); }
    };

    const handleBulkDelete = () => {
        startBulkDelete(async () => {
            const ids = Array.from(selectedIds);
            const result = await bulkDeleteSuppliersAction(ids);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`${result.count} fournisseur(s) supprimé(s).`);
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
                        placeholder="Rechercher un fournisseur..."
                        className="pl-8"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 ml-auto">
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
                        <Plus className="mr-2 h-4 w-4" /> Nouveau Fournisseur
                    </Button>
                </div>
            </div>

            {filteredSuppliers.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
                    Aucun fournisseur trouvé.
                </div>
            ) : (
                <>
                    {/* LIST VIEW */}
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
                                            <TableHead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm font-semibold">Nom</TableHead>
                                            <TableHead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm font-semibold">Contact</TableHead>
                                            <TableHead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm font-semibold">Email</TableHead>
                                            <TableHead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm font-semibold">Téléphone</TableHead>
                                            <TableHead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm font-semibold text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredSuppliers.map((supplier) => (
                                            <TableRow
                                                key={supplier.id}
                                                className={cn("hover:bg-muted/5 group", selectedIds.has(supplier.id) && "bg-primary/5")}
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedIds.has(supplier.id)}
                                                        onCheckedChange={() => toggleSelect(supplier.id)}
                                                        aria-label={`Sélectionner ${supplier.name}`}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn("h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0", avatarColor(supplier.name))}>
                                                            {getInitials(supplier.name)}
                                                        </span>
                                                        {supplier.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{supplier.contact_name || "-"}</TableCell>
                                                <TableCell className="text-muted-foreground">{supplier.email || "-"}</TableCell>
                                                <TableCell className="text-muted-foreground">{supplier.phone || "-"}</TableCell>
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
                                                            <DropdownMenuItem onClick={() => handleOpenEdit(supplier)}>
                                                                <Edit className="mr-2 h-4 w-4" /> Modifier
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => setDeletingSupplier(supplier)}
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

                    {/* GRID VIEW */}
                    {view === "grid" && (
                        <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-300 pb-2">
                                {filteredSuppliers.map((supplier) => (
                                    <div
                                        key={supplier.id}
                                        className={cn(
                                            "group relative bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all",
                                            selectedIds.has(supplier.id) && "ring-2 ring-primary border-primary"
                                        )}
                                    >
                                        <div className="absolute top-3 left-3">
                                            <Checkbox
                                                checked={selectedIds.has(supplier.id)}
                                                onCheckedChange={() => toggleSelect(supplier.id)}
                                                aria-label={`Sélectionner ${supplier.name}`}
                                                className="opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 transition-opacity"
                                            />
                                        </div>
                                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-secondary" onClick={() => handleOpenEdit(supplier)}>
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeletingSupplier(supplier)}>
                                                <Trash className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>

                                        <div className="flex flex-col items-center text-center mb-4 pt-4">
                                            <div className={cn("h-14 w-14 rounded-full flex items-center justify-center text-xl font-bold mb-3", avatarColor(supplier.name))}>
                                                {getInitials(supplier.name)}
                                            </div>
                                            <h3 className="font-semibold text-secondary text-sm leading-tight">{supplier.name}</h3>
                                            {supplier.contact_name && (
                                                <p className="text-xs text-muted-foreground mt-1">{supplier.contact_name}</p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5 text-xs text-muted-foreground">
                                            {supplier.email && (
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <Mail className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">{supplier.email}</span>
                                                </div>
                                            )}
                                            {supplier.phone && (
                                                <div className="flex items-center gap-1.5">
                                                    <Phone className="h-3 w-3 shrink-0" />
                                                    <span>{supplier.phone}</span>
                                                </div>
                                            )}
                                            {supplier.address && (
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <MapPin className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">{supplier.address}</span>
                                                </div>
                                            )}
                                            {supplier.notes && (
                                                <p className="mt-2 text-[11px] line-clamp-2 italic text-muted-foreground/70 border-t border-border pt-2">
                                                    {supplier.notes}
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
                        <DialogTitle>{editingSupplier ? "Modifier le Fournisseur" : "Nouveau Fournisseur"}</DialogTitle>
                    </DialogHeader>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nom</Label>
                            <Input id="name" name="name" required defaultValue={editingSupplier?.name} placeholder="Ex: Metro, Rungis Express..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="contact_name">Nom du contact</Label>
                                <Input id="contact_name" name="contact_name" defaultValue={editingSupplier?.contact_name || ""} placeholder="Jean Dupont" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={editingSupplier?.email || ""} placeholder="contact@fournisseur.com" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Téléphone</Label>
                            <Input id="phone" name="phone" type="tel" defaultValue={editingSupplier?.phone || ""} placeholder="01 23 45 67 89" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="address">Adresse</Label>
                            <Textarea id="address" name="address" defaultValue={editingSupplier?.address || ""} placeholder="123 Rue du Commerce, 75001 Paris" className="resize-none h-16" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" name="notes" placeholder="Conditions de livraison, délais..." defaultValue={editingSupplier?.notes || ""} className="resize-none h-20" />
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
                open={!!deletingSupplier}
                onOpenChange={(open) => { if (!open) setDeletingSupplier(null); }}
                title="Supprimer ce fournisseur ?"
                description={`"${deletingSupplier?.name}" sera supprimé. Cette action est irréversible.`}
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                variant="destructive"
                onConfirm={handleDeleteConfirmed}
            />

            {/* Bulk Delete Confirmation */}
            <ConfirmDialog
                open={isBulkDeleteOpen}
                onOpenChange={setIsBulkDeleteOpen}
                title={`Supprimer ${selectedIds.size} fournisseur(s) ?`}
                description={`Ces ${selectedIds.size} fournisseurs seront supprimés. Cette action est irréversible.`}
                confirmLabel={isBulkDeleting ? "Suppression..." : `Supprimer ${selectedIds.size} fournisseur(s)`}
                cancelLabel="Annuler"
                variant="destructive"
                onConfirm={handleBulkDelete}
            />

            {/* Import Dialog */}
            <ImportSuppliersDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
        </div>
    );
}
