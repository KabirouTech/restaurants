"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle as CardHeaderTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Edit, Trash, Plus } from "lucide-react";
import { createCapacityTypeAction, updateCapacityTypeAction, deleteCapacityTypeAction } from "@/actions/capacity-types";
import { toast } from "sonner";

interface CapacityType {
    id: string;
    organization_id: string;
    name: string;
    load_cost: number;
    color_code: string;
}

interface CapacitySettingsProps {
    capacityTypes: CapacityType[];
}

export function CapacitySettings({ capacityTypes }: CapacitySettingsProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<CapacityType | null>(null);
    const [loading, setLoading] = useState(false);

    // Alert Dialog State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        try {
            const result = editingType
                ? await updateCapacityTypeAction(formData)
                : await createCapacityTypeAction(formData);

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(editingType ? "Type mis à jour !" : "Type créé !");
                setIsDialogOpen(false);
            }
        } catch (error) {
            toast.error("Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (id: string) => {
        setDeleteId(id);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const result = await deleteCapacityTypeAction(deleteId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Type supprimé !");
            }
        } catch (error) {
            toast.error("Erreur lors de la suppression.");
        } finally {
            setDeleteId(null);
        }
    };

    const openCreateDialog = () => {
        setEditingType(null);
        setIsDialogOpen(true);
    };

    const openEditDialog = (type: CapacityType) => {
        setEditingType(type);
        setIsDialogOpen(true);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardHeaderTitle>Types d'Événements</CardHeaderTitle>
                    <CardDescription>Gérez les types de prestations (Mariages, Cocktails, etc.) et leur impact sur la capacité.</CardDescription>
                </div>
                <Button onClick={openCreateDialog} className="gap-2">
                    <Plus className="h-4 w-4" /> Nouveau Type
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Charge (Unités)</TableHead>
                            <TableHead>Couleur</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {capacityTypes.map((type) => (
                            <TableRow key={type.id}>
                                <TableCell className="font-medium">{type.name}</TableCell>
                                <TableCell>{type.load_cost}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-4 w-4 rounded-full border border-border"
                                            style={{ backgroundColor: type.color_code }}
                                        />
                                        <span className="text-xs text-muted-foreground">{type.color_code}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(type)}>
                                        <Edit className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => confirmDelete(type.id)}>
                                        <Trash className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingType ? "Modifier le type" : "Nouveau type d'événement"}</DialogTitle>
                    </DialogHeader>
                    <form action={handleSubmit} className="space-y-4">
                        {editingType && <input type="hidden" name="id" value={editingType.id} />}

                        <div className="space-y-2">
                            <Label htmlFor="name">Nom</Label>
                            <Input id="name" name="name" defaultValue={editingType?.name || ""} required placeholder="Ex: Mariage" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="loadCost">Coût de Charge</Label>
                                <Input
                                    id="loadCost"
                                    name="loadCost"
                                    type="number"
                                    defaultValue={editingType?.load_cost || 10}
                                    required
                                    min="1"
                                />
                                <p className="text-[10px] text-muted-foreground">Unités de capacité consommées par jour.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="colorCode">Couleur</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="colorCode"
                                        name="colorCode"
                                        type="color"
                                        className="w-12 p-1 h-10"
                                        defaultValue={editingType?.color_code || "#3b82f6"}
                                    />
                                    <Input
                                        name="colorCodeText"
                                        defaultValue={editingType?.color_code || "#3b82f6"}
                                        className="flex-1"
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                            <Button type="submit" disabled={loading}>{loading ? "Enregistrement..." : "Enregistrer"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Cela supprimera ce type d'événement.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
