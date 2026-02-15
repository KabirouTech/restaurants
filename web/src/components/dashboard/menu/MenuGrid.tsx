"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Edit2, MoreHorizontal, Trash2 } from "lucide-react";
import { deleteProductAction } from "@/actions/products";
import { toast } from "sonner";
import { ProductDialog } from "@/components/dashboard/menu/ProductDialog";

type Product = {
    id: string;
    name: string;
    description: string;
    price_cents: number;
    category: string;
    image_url: string;
};

export function MenuGrid({ products }: { products: Product[] }) {
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce plat ?")) return;
        setLoadingId(id);
        const res = await deleteProductAction(id);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Plat supprimé");
        }
        setLoadingId(null);
    };

    return (
        <>
            {products.length === 0 ? (
                <div className="text-center p-12 bg-muted/20 border border-dashed border-border rounded-xl">
                    <p className="text-muted-foreground">Aucun plat dans votre menu pour le moment.</p>
                    <p className="text-sm text-muted-foreground/70">Cliquez sur "Ajouter un Plat" pour commencer.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                    {products.map((product) => (
                        <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-all border-border relative">
                            <div className="aspect-video bg-muted relative">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/50">Pas d'image</div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 z-10">
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
                                        onClick={() => handleDelete(product.id)}
                                        disabled={loadingId === product.id}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-semibold bg-black/60 text-white rounded backdrop-blur-sm">
                                    {product.category}
                                </span>
                            </div>

                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg font-serif text-secondary line-clamp-1">{product.name}</h3>
                                    <span className="font-mono font-medium text-primary">
                                        {(product.price_cents / 100).toFixed(2)}€
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 h-10 leading-relaxed">
                                    {product.description || "Aucune description disponible."}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            <ProductDialog
                open={!!editingProduct}
                onOpenChange={(open) => {
                    if (!open) setEditingProduct(null);
                }}
                productToEdit={editingProduct}
            />
        </>
    );
}
