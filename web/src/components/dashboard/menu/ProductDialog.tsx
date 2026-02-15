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
import { Plus, Image as ImageIcon, Loader2 } from "lucide-react";
import { createProductAction, updateProductAction } from "@/actions/products";
import { toast } from "sonner"; // If sonner is installed, let's use it. If not, alert.

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
}

export function ProductDialog({ productToEdit, open: controlledOpen, onOpenChange }: ProductDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = typeof controlledOpen !== "undefined";
    const setOpen = isControlled ? onOpenChange! : setInternalOpen;
    const open = isControlled ? controlledOpen : internalOpen;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Image state for "upload" simulation
    const [imageUrl, setImageUrl] = useState(productToEdit?.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60");

    useEffect(() => {
        if (productToEdit) {
            setImageUrl(productToEdit.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60");
        }
    }, [productToEdit]);

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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // In a real app, this would upload to storage. 
            // For now, we simulate a local preview.
            const objectUrl = URL.createObjectURL(file);
            setImageUrl(objectUrl);
            // Note: The form submission currently sends the URL string. 
            // To support real file uploads, we'd need to modify the server action to handle File objects and upload to Supabase Storage.
            // For this MVP, we will stick to URL input or Mock.
            toast.info("Image preview set (Upload not implemented in MVP)");
        }
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
                    <DialogTitle className="font-serif text-2xl text-secondary">
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
                            <label className="text-sm font-medium leading-none">Prix (€)</label>
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
                                <option value="Entrée">Entrée</option>
                                <option value="Plat">Plat</option>
                                <option value="Dessert">Dessert</option>
                                <option value="Boisson">Boisson</option>
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

                    {/* Image Upload placeholder */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Image</label>
                        <div className="border inter-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/30 transition-colors cursor-pointer text-xs relative overflow-hidden group">
                            {imageUrl ? (
                                <img src={imageUrl} alt="Preview" className="h-20 w-full object-cover rounded mb-2" />
                            ) : (
                                <ImageIcon className="h-6 w-6 mb-2 opacity-50" />
                            )}

                            <span className="z-10 bg-white/80 px-2 py-1 rounded backdrop-blur-sm">Changer l'image</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                        {/* Hidden input for URL */}
                        <div className="flex gap-2">
                            <Input
                                name="imageUrl"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://..."
                                className="text-xs font-mono h-8"
                            />
                        </div>
                    </div>

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
