"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import { createProductAction, updateProductAction } from "@/actions/products";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { createClient } from "@/utils/supabase/client";

type Product = {
    id: string;
    name: string;
    description: string;
    price_cents: number;
    category: string;
    image_url: string;
};

interface ProductDialogProps {
    productToEdit?: Product | null;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    currency?: string;
}

export function ProductDialog({ productToEdit, open: controlledOpen, onOpenChange, currency = "EUR" }: ProductDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [categories, setCategories] = useState<string[]>(["Entrée", "Plat", "Dessert", "Boisson"]);
    const [customCategory, setCustomCategory] = useState("");

    const isControlled = typeof controlledOpen !== "undefined";
    const setOpen = isControlled ? onOpenChange! : setInternalOpen;
    const open = isControlled ? controlledOpen : internalOpen;

    const DEFAULT_CATEGORIES = ["Entrée", "Plat", "Dessert", "Boisson"];

    useEffect(() => {
        const supabase = createClient();
        supabase
            .from("products")
            .select("category")
            .eq("is_active", true)
            .then(({ data }) => {
                if (data) {
                    const dbCats = data.map((r: any) => r.category).filter(Boolean);
                    const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...dbCats])).sort();
                    setCategories(merged);
                }
            });
    }, [open]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        let result;
        if (productToEdit) {
            formData.append("id", productToEdit.id);
            // If image hasn't changed from original, we might not need to send it, but here we just send everything.
            result = await updateProductAction(formData);
        } else {
            result = await createProductAction(formData);
        }

        if (result.error) {
            setError(result.error);
            toast.error(result.error);
        } else {
            setOpen(false);
            toast.success(productToEdit ? "Produit modifié !" : "Produit ajouté !");
        }
        setLoading(false);
    };



    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm font-medium gap-2">
                        <Plus className="h-4 w-4" /> Ajouter un Plat
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="font-serif text-2xl text-foreground">
                        {productToEdit ? "Modifier le Plat" : "Nouveau Plat"}
                    </DialogTitle>
                    <DialogDescription>
                        {productToEdit ? "Modifiez les détails de votre plat." : "Ajoutez un nouveau plat à votre catalogue."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <label className="text-sm font-medium leading-none">Nom du plat</label>
                            <Input
                                name="name"
                                defaultValue={productToEdit?.name}
                                placeholder="Ex: Thiéboudienne Rouge"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Prix ({currency})</label>
                            <Input
                                name="price"
                                type="number"
                                step="0.01"
                                defaultValue={productToEdit ? (productToEdit.price_cents / 100).toFixed(2) : ""}
                                placeholder="15.00"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Catégorie</label>
                            <select
                                name="category"
                                defaultValue={productToEdit?.category || "Plat"}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Description (Ingrédients)</label>
                        <textarea
                            name="description"
                            defaultValue={productToEdit?.description}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                            placeholder="Riz brisé, poisson frais, légumes du marché..."
                        />
                    </div>

                    {/* Image Upload */}
                    <ImageUpload
                        name="imageUrl"
                        label="Photo du plat"
                        defaultValue={productToEdit?.image_url}
                        folder="products"
                    />

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                        <Button type="submit" disabled={loading} className="bg-primary text-white">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {productToEdit ? "Mettre à jour" : "Enregistrer"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
