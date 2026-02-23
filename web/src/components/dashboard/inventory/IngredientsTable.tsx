"use client";

import { useState, useTransition } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, MoreHorizontal, Edit, Trash, Trash2, FileSpreadsheet, AlertTriangle, ChevronLeft } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { createIngredientAction, updateIngredientAction, deleteIngredientAction, bulkDeleteIngredientsAction } from "@/actions/ingredients";
import { quickCreateSupplierAction } from "@/actions/suppliers";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { ImportIngredientsDialog } from "./ImportIngredientsDialog";

type Ingredient = {
    id: string;
    organization_id: string;
    name: string;
    category: string | null;
    unit: string;
    current_stock: number;
    low_stock_threshold: number;
    cost_per_unit_cents: number;
    supplier_id: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

type Supplier = {
    id: string;
    name: string;
};

const CATEGORIES = [
    "Viandes", "Poissons", "Légumes", "Fruits",
    "Produits laitiers", "Épices", "Boissons", "Autre",
];

const UNITS = [
    { value: "kg", label: "kg" },
    { value: "g", label: "g" },
    { value: "L", label: "L" },
    { value: "cl", label: "cl" },
    { value: "pièce", label: "pièce" },
    { value: "botte", label: "botte" },
    { value: "sachet", label: "sachet" },
    { value: "unité", label: "unité" },
];

function isLowStock(ingredient: Ingredient) {
    return ingredient.low_stock_threshold > 0 && ingredient.current_stock < ingredient.low_stock_threshold;
}

function formatCurrency(cents: number, currency: string) {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(cents / 100);
}

export function IngredientsTable({ ingredients, suppliers, currency }: {
    ingredients: Ingredient[];
    suppliers: Supplier[];
    currency: string;
}) {
    const router = useRouter();
    const [view, setView] = useState<ViewMode>("list");
    const [filter, setFilter] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
    const [loading, setLoading] = useState(false);
    const [deletingIngredient, setDeletingIngredient] = useState<Ingredient | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [isBulkDeleting, startBulkDelete] = useTransition();
    const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>(suppliers);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>("none");
    const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
    const [newSupplier, setNewSupplier] = useState({ name: "", contact_name: "", email: "", phone: "", address: "", notes: "" });
    const [savingSupplier, setSavingSupplier] = useState(false);

    const filteredIngredients = ingredients.filter((i) =>
        i.name.toLowerCase().includes(filter.toLowerCase()) ||
        (i.category || "").toLowerCase().includes(filter.toLowerCase())
    );

    const allSelected = filteredIngredients.length > 0 && filteredIngredients.every(i => selectedIds.has(i.id));
    const someSelected = filteredIngredients.some(i => selectedIds.has(i.id));

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredIngredients.map(i => i.id)));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const resetSupplierForm = () => {
        setIsCreatingSupplier(false);
        setNewSupplier({ name: "", contact_name: "", email: "", phone: "", address: "", notes: "" });
    };

    const handleOpenCreate = () => {
        setEditingIngredient(null);
        setSelectedSupplierId("none");
        resetSupplierForm();
        setIsDialogOpen(true);
    };
    const handleOpenEdit = (ingredient: Ingredient) => {
        setEditingIngredient(ingredient);
        setSelectedSupplierId(ingredient.supplier_id || "none");
        resetSupplierForm();
        setIsDialogOpen(true);
    };

    const supplierName = (id: string | null) => {
        if (!id) return "-";
        return localSuppliers.find(s => s.id === id)?.name || "-";
    };

    const handleCreateSupplierInline = async () => {
        if (!newSupplier.name.trim()) return;
        setSavingSupplier(true);
        try {
            const result = await quickCreateSupplierAction(newSupplier);
            if (result.error) {
                toast.error(result.error);
            } else if (result.supplier) {
                setLocalSuppliers(prev => [...prev, result.supplier!]);
                setSelectedSupplierId(result.supplier.id);
                resetSupplierForm();
                toast.success(`Fournisseur "${result.supplier.name}" créé !`);
            }
        } finally {
            setSavingSupplier(false);
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        try {
            if (editingIngredient) {
                formData.append("id", editingIngredient.id);
                const result = await updateIngredientAction(formData);
                if (result.error) toast.error(result.error);
                else { toast.success("Ingrédient mis à jour !"); setIsDialogOpen(false); router.refresh(); }
            } else {
                const result = await createIngredientAction(formData);
                if (result.error) toast.error(result.error);
                else { toast.success("Ingrédient créé !"); setIsDialogOpen(false); router.refresh(); }
            }
        } catch { toast.error("Erreur inattendue."); }
        finally { setLoading(false); }
    };

    const handleDeleteConfirmed = async () => {
        if (!deletingIngredient) return;
        setLoading(true);
        try {
            const result = await deleteIngredientAction(deletingIngredient.id);
            if (result.error) toast.error(result.error);
            else { toast.success(`"${deletingIngredient.name}" supprimé.`); setDeletingIngredient(null); router.refresh(); }
        } finally { setLoading(false); }
    };

    const handleBulkDelete = () => {
        startBulkDelete(async () => {
            const ids = Array.from(selectedIds);
            const result = await bulkDeleteIngredientsAction(ids);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`${result.count} ingrédient(s) supprimé(s).`);
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
                        placeholder="Rechercher un ingrédient..."
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
                        <Plus className="mr-2 h-4 w-4" /> Nouvel Ingrédient
                    </Button>
                </div>
            </div>

            {filteredIngredients.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
                    Aucun ingrédient trouvé.
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
                                            <TableHead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm font-semibold">Catégorie</TableHead>
                                            <TableHead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm font-semibold">Stock</TableHead>
                                            <TableHead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm font-semibold">Seuil</TableHead>
                                            <TableHead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm font-semibold">Coût unitaire</TableHead>
                                            <TableHead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm font-semibold">Fournisseur</TableHead>
                                            <TableHead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-sm font-semibold text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredIngredients.map((ingredient) => (
                                            <TableRow
                                                key={ingredient.id}
                                                className={cn("hover:bg-muted/5 group", selectedIds.has(ingredient.id) && "bg-primary/5")}
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedIds.has(ingredient.id)}
                                                        onCheckedChange={() => toggleSelect(ingredient.id)}
                                                        aria-label={`Sélectionner ${ingredient.name}`}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {ingredient.name}
                                                        {isLowStock(ingredient) && (
                                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {ingredient.category && (
                                                        <Badge variant="secondary" className="text-[10px]">
                                                            {ingredient.category}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className={cn(isLowStock(ingredient) && "text-red-600 font-semibold")}>
                                                    {ingredient.current_stock} {ingredient.unit}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {ingredient.low_stock_threshold > 0 ? `${ingredient.low_stock_threshold} ${ingredient.unit}` : "-"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {ingredient.cost_per_unit_cents > 0 ? `${formatCurrency(ingredient.cost_per_unit_cents, currency)}/${ingredient.unit}` : "-"}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{supplierName(ingredient.supplier_id)}</TableCell>
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
                                                            <DropdownMenuItem onClick={() => handleOpenEdit(ingredient)}>
                                                                <Edit className="mr-2 h-4 w-4" /> Modifier
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => setDeletingIngredient(ingredient)}
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
                                {filteredIngredients.map((ingredient) => (
                                    <div
                                        key={ingredient.id}
                                        className={cn(
                                            "group relative bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all",
                                            selectedIds.has(ingredient.id) && "ring-2 ring-primary border-primary",
                                            isLowStock(ingredient) && "border-red-200 dark:border-red-900/50"
                                        )}
                                    >
                                        <div className="absolute top-3 left-3">
                                            <Checkbox
                                                checked={selectedIds.has(ingredient.id)}
                                                onCheckedChange={() => toggleSelect(ingredient.id)}
                                                aria-label={`Sélectionner ${ingredient.name}`}
                                                className="opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 transition-opacity"
                                            />
                                        </div>
                                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-secondary" onClick={() => handleOpenEdit(ingredient)}>
                                                <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeletingIngredient(ingredient)}>
                                                <Trash className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>

                                        <div className="pt-4 mb-3">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-secondary text-sm leading-tight">{ingredient.name}</h3>
                                                {isLowStock(ingredient) && (
                                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                                )}
                                            </div>
                                            {ingredient.category && (
                                                <Badge variant="secondary" className="mt-1.5 text-[10px]">
                                                    {ingredient.category}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="space-y-2 text-xs text-muted-foreground">
                                            <div className="flex justify-between">
                                                <span>Stock</span>
                                                <span className={cn("font-medium", isLowStock(ingredient) ? "text-red-600" : "text-foreground")}>
                                                    {ingredient.current_stock} {ingredient.unit}
                                                </span>
                                            </div>
                                            {ingredient.cost_per_unit_cents > 0 && (
                                                <div className="flex justify-between">
                                                    <span>Coût</span>
                                                    <span className="text-foreground">{formatCurrency(ingredient.cost_per_unit_cents, currency)}/{ingredient.unit}</span>
                                                </div>
                                            )}
                                            {ingredient.supplier_id && (
                                                <div className="flex justify-between">
                                                    <span>Fournisseur</span>
                                                    <span className="text-foreground">{supplierName(ingredient.supplier_id)}</span>
                                                </div>
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
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetSupplierForm(); setIsDialogOpen(open); }}>
                <DialogContent className={cn("transition-all duration-300", isCreatingSupplier ? "max-w-3xl" : "max-w-lg")}>
                    <div className="flex gap-6 overflow-hidden">
                        {/* Left: Ingredient form */}
                        <div className={cn("shrink-0 transition-all duration-300", isCreatingSupplier ? "w-1/2" : "w-full")}>
                            <DialogHeader>
                                <DialogTitle>{editingIngredient ? "Modifier l'Ingrédient" : "Nouvel Ingrédient"}</DialogTitle>
                            </DialogHeader>
                            <form action={handleSubmit} className="space-y-4 mt-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nom</Label>
                                    <Input id="name" name="name" required defaultValue={editingIngredient?.name} placeholder="Ex: Tomates cerises, Filet de boeuf..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="category">Catégorie</Label>
                                        <Select name="category" defaultValue={editingIngredient?.category || ""}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CATEGORIES.map(cat => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="unit">Unité</Label>
                                        <Select name="unit" defaultValue={editingIngredient?.unit || "kg"}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Unité" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {UNITS.map(u => (
                                                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="current_stock">Stock actuel</Label>
                                        <Input id="current_stock" name="current_stock" type="number" step="0.01" defaultValue={editingIngredient?.current_stock ?? 0} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="low_stock_threshold">Seuil d&apos;alerte</Label>
                                        <Input id="low_stock_threshold" name="low_stock_threshold" type="number" step="0.01" defaultValue={editingIngredient?.low_stock_threshold ?? 0} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="cost_per_unit">Coût unitaire ({currency})</Label>
                                        <Input id="cost_per_unit" name="cost_per_unit" type="number" step="0.01" defaultValue={editingIngredient ? (editingIngredient.cost_per_unit_cents / 100).toFixed(2) : "0"} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Fournisseur</Label>
                                        <input type="hidden" name="supplier_id" value={selectedSupplierId} />
                                        <div className="flex gap-2">
                                            <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue placeholder="Aucun" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Aucun</SelectItem>
                                                    {localSuppliers.map(s => (
                                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button type="button" size="icon" variant="outline" onClick={() => setIsCreatingSupplier(true)} title="Nouveau fournisseur" className={cn("shrink-0", isCreatingSupplier && "hidden")}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? "Enregistrement..." : "Enregistrer"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </div>

                        {/* Right: Supplier creation panel */}
                        {isCreatingSupplier && (
                            <div className="w-1/2 border-l border-border pl-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="flex items-center gap-2 mb-4">
                                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={resetSupplierForm}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <h3 className="font-semibold text-sm">Nouveau Fournisseur</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="new_supplier_name" className="text-xs">Nom *</Label>
                                        <Input
                                            id="new_supplier_name"
                                            autoFocus
                                            value={newSupplier.name}
                                            onChange={(e) => setNewSupplier(s => ({ ...s, name: e.target.value }))}
                                            placeholder="Ex: Metro, Rungis Express..."
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="new_supplier_contact" className="text-xs">Nom du contact</Label>
                                        <Input
                                            id="new_supplier_contact"
                                            value={newSupplier.contact_name}
                                            onChange={(e) => setNewSupplier(s => ({ ...s, contact_name: e.target.value }))}
                                            placeholder="Jean Dupont"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="new_supplier_email" className="text-xs">Email</Label>
                                            <Input
                                                id="new_supplier_email"
                                                type="email"
                                                value={newSupplier.email}
                                                onChange={(e) => setNewSupplier(s => ({ ...s, email: e.target.value }))}
                                                placeholder="contact@fournisseur.com"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label htmlFor="new_supplier_phone" className="text-xs">Téléphone</Label>
                                            <Input
                                                id="new_supplier_phone"
                                                type="tel"
                                                value={newSupplier.phone}
                                                onChange={(e) => setNewSupplier(s => ({ ...s, phone: e.target.value }))}
                                                placeholder="01 23 45 67 89"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="new_supplier_address" className="text-xs">Adresse</Label>
                                        <Textarea
                                            id="new_supplier_address"
                                            value={newSupplier.address}
                                            onChange={(e) => setNewSupplier(s => ({ ...s, address: e.target.value }))}
                                            placeholder="123 Rue du Commerce, Paris"
                                            className="resize-none h-14"
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <Label htmlFor="new_supplier_notes" className="text-xs">Notes</Label>
                                        <Textarea
                                            id="new_supplier_notes"
                                            value={newSupplier.notes}
                                            onChange={(e) => setNewSupplier(s => ({ ...s, notes: e.target.value }))}
                                            placeholder="Conditions, délais..."
                                            className="resize-none h-14"
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Button type="button" className="flex-1" onClick={handleCreateSupplierInline} disabled={savingSupplier || !newSupplier.name.trim()}>
                                            {savingSupplier ? "Création..." : "Créer le fournisseur"}
                                        </Button>
                                        <Button type="button" variant="outline" onClick={resetSupplierForm}>
                                            Annuler
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Single Delete Confirmation */}
            <ConfirmDialog
                open={!!deletingIngredient}
                onOpenChange={(open) => { if (!open) setDeletingIngredient(null); }}
                title="Supprimer cet ingrédient ?"
                description={`"${deletingIngredient?.name}" sera supprimé. Cette action est irréversible.`}
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                variant="destructive"
                onConfirm={handleDeleteConfirmed}
            />

            {/* Bulk Delete Confirmation */}
            <ConfirmDialog
                open={isBulkDeleteOpen}
                onOpenChange={setIsBulkDeleteOpen}
                title={`Supprimer ${selectedIds.size} ingrédient(s) ?`}
                description={`Ces ${selectedIds.size} ingrédients seront supprimés. Cette action est irréversible.`}
                confirmLabel={isBulkDeleting ? "Suppression..." : `Supprimer ${selectedIds.size} ingrédient(s)`}
                cancelLabel="Annuler"
                variant="destructive"
                onConfirm={handleBulkDelete}
            />

            {/* Import Dialog */}
            <ImportIngredientsDialog open={isImportOpen} onOpenChange={setIsImportOpen} suppliers={suppliers} />
        </div>
    );
}
