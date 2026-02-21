"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { BannerDialog } from "@/components/admin/BannerDialog";
import { deleteBannerAction } from "@/actions/admin/banners";
import { toast } from "sonner";
import { Image, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Banner {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    link_url: string | null;
    is_active: boolean;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
}

export function BannersClient({ banners }: { banners: Banner[] }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editBanner, setEditBanner] = useState<Banner | undefined>();
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleEdit = (banner: Banner) => {
        setEditBanner(banner);
        setDialogOpen(true);
    };

    const handleCreate = () => {
        setEditBanner(undefined);
        setDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (!confirm("Supprimer cette bannière ?")) return;
        setDeletingId(id);
        startTransition(async () => {
            const result = await deleteBannerAction(id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Bannière supprimée");
            }
            setDeletingId(null);
        });
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans">
            <header className="h-20 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-8 z-10 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-foreground flex items-center gap-3">
                        <Image className="h-7 w-7 text-orange-500" />
                        Bannières
                    </h1>
                    <p className="text-sm text-muted-foreground font-light">{banners.length} bannière{banners.length > 1 ? "s" : ""}</p>
                </div>
                <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-5">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle bannière
                </Button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {banners.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {banners.map((banner) => (
                            <div key={banner.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden group">
                                {/* Image */}
                                <div className="relative h-40 bg-muted">
                                    {banner.image_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={banner.image_url}
                                            alt={banner.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            <Image className="h-10 w-10 opacity-30" />
                                        </div>
                                    )}
                                    {/* Status badge */}
                                    <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold ${banner.is_active
                                        ? "bg-green-500 text-white"
                                        : "bg-red-500 text-white"
                                        }`}>
                                        {banner.is_active ? "Active" : "Inactive"}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="font-bold text-foreground font-serif text-lg mb-1">{banner.title}</h3>
                                    {banner.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{banner.description}</p>
                                    )}
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        {banner.start_date && (
                                            <p>Début : {format(new Date(banner.start_date), "d MMM yyyy HH:mm", { locale: fr })}</p>
                                        )}
                                        {banner.end_date && (
                                            <p>Fin : {format(new Date(banner.end_date), "d MMM yyyy HH:mm", { locale: fr })}</p>
                                        )}
                                        {banner.link_url && (
                                            <p className="font-mono truncate">Lien : {banner.link_url}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="border-t border-border p-3 flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(banner)}>
                                        <Pencil className="h-3.5 w-3.5 mr-1" />
                                        Modifier
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                        onClick={() => handleDelete(banner.id)}
                                        disabled={deletingId === banner.id}
                                    >
                                        {deletingId === banner.id ? (
                                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                                        )}
                                        Supprimer
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Image className="h-16 w-16 mb-4 opacity-30" />
                        <p className="text-lg font-medium mb-2">Aucune bannière</p>
                        <p className="text-sm mb-6">Créez votre première bannière promotionnelle</p>
                        <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Créer une bannière
                        </Button>
                    </div>
                )}
            </div>

            <BannerDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                banner={editBanner}
            />
        </div>
    );
}
