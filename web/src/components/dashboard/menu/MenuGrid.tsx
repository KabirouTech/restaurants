"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Trash2, ImageOff } from "lucide-react";
import { deleteProductAction, bulkDeleteProductsAction } from "@/actions/products";
import { toast } from "sonner";
import { ProductDialog } from "@/components/dashboard/menu/ProductDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { formatPrice } from "@/lib/currencies";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type Product = {
    id: string;
    name: string;
    description: string;
    price_cents: number;
    category: string;
    image_url: string;
};

export function MenuGrid({ products, currency }: { products: Product[], currency: string }) {
    const router = useRouter();
    const [view, setView] = useState<ViewMode>("grid");
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [isBulkDeleting, startBulkDelete] = useTransition();

    const allSelected = products.length > 0 && products.every(p => selectedIds.has(p.id));
    const someSelected = products.some(p => selectedIds.has(p.id));

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(products.map(p => p.id)));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleDeleteConfirmed = async () => {
        if (!deletingProduct) return;
        setLoadingId(deletingProduct.id);
        setDeletingProduct(null);
        const res = await deleteProductAction(deletingProduct.id);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success(`"${deletingProduct.name}" a été supprimé.`);
            router.refresh();
        }
        setLoadingId(null);
    };

    const handleBulkDelete = () => {
        startBulkDelete(async () => {
            const ids = Array.from(selectedIds);
            const result = await bulkDeleteProductsAction(ids);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`${result.count} plat(s) supprimé(s).`);
                setSelectedIds(new Set());
                setIsBulkDeleteOpen(false);
                router.refresh();
            }
        });
    };

    if (products.length === 0) {
        return (
            <div className="text-center p-12 bg-muted/20 border border-dashed border-border rounded-xl">
                <p className="text-muted-foreground">Aucun plat dans votre menu pour le moment.</p>
                <p className="text-sm text-muted-foreground/70">Cliquez sur "Ajouter un Plat" pour commencer.</p>
            </div>
        );
    }

    return (
        <>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">{products.length} plat{products.length > 1 ? "s" : ""}</p>
                    {/* Bulk action bar */}
                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 border border-destructive/20 rounded-lg animate-in slide-in-from-left-4 duration-200">
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
                </div>
                <ViewToggle view={view} onChange={setView} />
            </div>

            {/* ── GRID VIEW ─────────────────────────────────────────── */}
            {view === "grid" && (
                <div className="max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-300 pb-2">
                        {products.map((product) => (
                            <Card
                                key={product.id}
                                className={cn(
                                    "overflow-hidden group hover:shadow-lg transition-all border-border relative",
                                    selectedIds.has(product.id) && "ring-2 ring-primary border-primary"
                                )}
                            >
                                <div className="aspect-video bg-muted relative">
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 gap-1">
                                            <ImageOff className="h-8 w-8" />
                                            <span className="text-xs">Pas d'image</span>
                                        </div>
                                    )}

                                    {/* Checkbox top-left */}
                                    <div className="absolute top-2 left-2 z-10">
                                        <Checkbox
                                            checked={selectedIds.has(product.id)}
                                            onCheckedChange={() => toggleSelect(product.id)}
                                            aria-label={`Sélectionner ${product.name}`}
                                            className="bg-white/90 border-white/60 opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 transition-opacity shadow-sm"
                                        />
                                    </div>

                                    {/* Action buttons top-right */}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0 z-10">
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className="h-8 w-8 bg-white/90 shadow-sm hover:bg-white text-foreground"
                                            onClick={() => setEditingProduct(product)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="h-8 w-8 shadow-sm"
                                            onClick={() => setDeletingProduct(product)}
                                            disabled={loadingId === product.id}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <span className="absolute bottom-2 left-2 px-2 py-0.5 text-xs font-semibold bg-black/60 text-white rounded backdrop-blur-sm">
                                        {product.category}
                                    </span>
                                </div>

                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg font-serif text-secondary line-clamp-1">{product.name}</h3>
                                        <span className="font-mono font-medium text-primary shrink-0 ml-2">
                                            {formatPrice(product.price_cents, currency)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2 h-10 leading-relaxed">
                                        {product.description || "Aucune description disponible."}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* ── LIST VIEW ─────────────────────────────────────────── */}
            {view === "list" && (
                <div className="rounded-xl border border-border bg-card shadow-sm animate-in fade-in duration-300">
                    {/* Sticky header */}
                    <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-2 bg-muted/90 backdrop-blur-sm border-b border-border text-xs font-semibold text-muted-foreground rounded-t-xl">
                        <Checkbox
                            checked={allSelected}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Tout sélectionner"
                            data-state={!allSelected && someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                        />
                        <div className="h-4 w-16 shrink-0">Image</div>
                        <div className="flex-1">Nom / Catégorie</div>
                        <div className="shrink-0 w-20 text-right">Prix</div>
                        <div className="shrink-0 w-16"></div>
                    </div>
                    <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                        {products.map((product, i) => (
                            <div
                                key={product.id}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3 group hover:bg-muted/30 transition-colors",
                                    i !== 0 && "border-t border-border",
                                    selectedIds.has(product.id) && "bg-primary/5"
                                )}
                            >
                                <Checkbox
                                    checked={selectedIds.has(product.id)}
                                    onCheckedChange={() => toggleSelect(product.id)}
                                    aria-label={`Sélectionner ${product.name}`}
                                />
                                {/* Thumbnail */}
                                <div className="h-12 w-16 rounded-md overflow-hidden bg-muted shrink-0">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="object-cover w-full h-full" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground/40">
                                            <ImageOff className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-secondary text-sm truncate">{product.name}</span>
                                        <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                                            {product.category}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                        {product.description || "Aucune description."}
                                    </p>
                                </div>

                                {/* Price */}
                                <span className="font-mono font-semibold text-primary text-sm shrink-0">
                                    {formatPrice(product.price_cents, currency)}
                                </span>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-secondary" onClick={() => setEditingProduct(product)}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeletingProduct(product)} disabled={loadingId === product.id}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Edit Dialog */}
            <ProductDialog
                open={!!editingProduct}
                onOpenChange={(open) => { if (!open) setEditingProduct(null); }}
                productToEdit={editingProduct}
                currency={currency}
            />

            {/* Single Delete Confirmation */}
            <ConfirmDialog
                open={!!deletingProduct}
                onOpenChange={(open) => { if (!open) setDeletingProduct(null); }}
                title="Supprimer ce plat ?"
                description={`"${deletingProduct?.name}" sera définitivement retiré de votre menu. Cette action est irréversible.`}
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                variant="destructive"
                onConfirm={handleDeleteConfirmed}
            />

            {/* Bulk Delete Confirmation */}
            <ConfirmDialog
                open={isBulkDeleteOpen}
                onOpenChange={setIsBulkDeleteOpen}
                title={`Supprimer ${selectedIds.size} plat(s) ?`}
                description={`Ces ${selectedIds.size} plats seront retirés de votre menu. Cette action est irréversible.`}
                confirmLabel={isBulkDeleting ? "Suppression..." : `Supprimer ${selectedIds.size} plat(s)`}
                cancelLabel="Annuler"
                variant="destructive"
                onConfirm={handleBulkDelete}
            />
        </>
    );
}
