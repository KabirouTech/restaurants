"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { TutorialDialog } from "@/components/admin/TutorialDialog";
import { deleteTutorialAction } from "@/actions/admin/tutorials";
import { toast } from "sonner";
import { Play, Plus, Pencil, Trash2, Loader2, Star, LayoutGrid, List } from "lucide-react";

interface Tutorial {
    id: string;
    title: string;
    description: string | null;
    embed_code: string;
    is_active: boolean;
    is_featured: boolean;
    sort_order: number;
    created_at: string;
}

export function TutorialsClient({ tutorials }: { tutorials: Tutorial[] }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editTutorial, setEditTutorial] = useState<Tutorial | undefined>();
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [view, setView] = useState<"grid" | "list">("grid");

    const handleEdit = (tutorial: Tutorial) => {
        setEditTutorial(tutorial);
        setDialogOpen(true);
    };

    const handleCreate = () => {
        setEditTutorial(undefined);
        setDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (!confirm("Supprimer ce tutoriel ?")) return;
        setDeletingId(id);
        startTransition(async () => {
            const result = await deleteTutorialAction(id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Tutoriel supprimé");
            }
            setDeletingId(null);
        });
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans">
            <header className="h-20 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-8 z-10 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-foreground flex items-center gap-3">
                        <Play className="h-7 w-7 text-orange-500" />
                        Tutoriels
                    </h1>
                    <p className="text-sm text-muted-foreground font-light">{tutorials.length} tutoriel{tutorials.length > 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                        <button
                            onClick={() => setView("grid")}
                            className={`p-2 transition-colors ${view === "grid" ? "bg-orange-500 text-white" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setView("list")}
                            className={`p-2 transition-colors ${view === "list" ? "bg-orange-500 text-white" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>
                    <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-5">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau tutoriel
                    </Button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {tutorials.length > 0 ? (
                    view === "grid" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tutorials.map((tutorial) => (
                                <div key={tutorial.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden group">
                                    {/* Embed preview */}
                                    <div className="relative aspect-video bg-muted overflow-hidden pointer-events-none">
                                        <div
                                            className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0"
                                            dangerouslySetInnerHTML={{ __html: tutorial.embed_code }}
                                        />
                                        {/* Overlay to block interaction */}
                                        <div className="absolute inset-0" />
                                        {/* Badges */}
                                        <div className="absolute top-3 right-3 flex gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tutorial.is_active
                                                ? "bg-green-500 text-white"
                                                : "bg-red-500 text-white"
                                                }`}>
                                                {tutorial.is_active ? "Active" : "Inactive"}
                                            </span>
                                            {tutorial.is_featured && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white flex items-center gap-1">
                                                    <Star className="h-2.5 w-2.5" />
                                                    En vedette
                                                </span>
                                            )}
                                        </div>
                                        {tutorial.sort_order > 0 && (
                                            <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary">
                                                #{tutorial.sort_order}
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <h3 className="font-bold text-foreground font-serif text-lg mb-1">{tutorial.title}</h3>
                                        {tutorial.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{tutorial.description}</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="border-t border-border p-3 flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(tutorial)}>
                                            <Pencil className="h-3.5 w-3.5 mr-1" />
                                            Modifier
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                            onClick={() => handleDelete(tutorial.id)}
                                            disabled={deletingId === tutorial.id}
                                        >
                                            {deletingId === tutorial.id ? (
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
                        /* List view */
                        <div className="space-y-3">
                            {tutorials.map((tutorial) => (
                                <div key={tutorial.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex items-center gap-4">
                                    {/* Small embed preview */}
                                    <div className="relative w-48 shrink-0 aspect-video bg-muted overflow-hidden pointer-events-none">
                                        <div
                                            className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0"
                                            dangerouslySetInnerHTML={{ __html: tutorial.embed_code }}
                                        />
                                        <div className="absolute inset-0" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 py-3 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-foreground font-serif text-base truncate">{tutorial.title}</h3>
                                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${tutorial.is_active
                                                ? "bg-green-500 text-white"
                                                : "bg-red-500 text-white"
                                                }`}>
                                                {tutorial.is_active ? "Active" : "Inactive"}
                                            </span>
                                            {tutorial.is_featured && (
                                                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white flex items-center gap-1">
                                                    <Star className="h-2.5 w-2.5" />
                                                    En vedette
                                                </span>
                                            )}
                                            {tutorial.sort_order > 0 && (
                                                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary">
                                                    #{tutorial.sort_order}
                                                </span>
                                            )}
                                        </div>
                                        {tutorial.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-1">{tutorial.description}</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pr-4 shrink-0">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(tutorial)}>
                                            <Pencil className="h-3.5 w-3.5 mr-1" />
                                            Modifier
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                            onClick={() => handleDelete(tutorial.id)}
                                            disabled={deletingId === tutorial.id}
                                        >
                                            {deletingId === tutorial.id ? (
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
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Play className="h-16 w-16 mb-4 opacity-30" />
                        <p className="text-lg font-medium mb-2">Aucun tutoriel</p>
                        <p className="text-sm mb-6">Créez votre premier tutoriel Arcade</p>
                        <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-600 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Créer un tutoriel
                        </Button>
                    </div>
                )}
            </div>

            <TutorialDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                tutorial={editTutorial}
            />
        </div>
    );
}
