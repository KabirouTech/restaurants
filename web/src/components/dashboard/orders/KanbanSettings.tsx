"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import { GripVertical, Plus, Trash2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { updateKanbanColumnsAction } from "@/actions/kanban";
import { DEFAULT_KANBAN_COLUMNS, type KanbanColumn } from "@/components/dashboard/orders/KanbanBoard";


interface KanbanSettingsProps {
    initialColumns: KanbanColumn[];
}

export function KanbanSettings({ initialColumns }: KanbanSettingsProps) {
    const [columns, setColumns] = useState<KanbanColumn[]>(
        initialColumns.length > 0 ? initialColumns : DEFAULT_KANBAN_COLUMNS
    );
    const [isPending, startTransition] = useTransition();
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

    const addColumn = () => {
        const newId = `stage_${Date.now()}`;
        setColumns((prev) => [...prev, { id: newId, label: "Nouvelle étape", color: "#60A5FA" }]);
    };

    const removeColumn = (idx: number) => {
        setColumns((prev) => prev.filter((_, i) => i !== idx));
    };

    const updateColumn = (idx: number, patch: Partial<KanbanColumn>) => {
        setColumns((prev) => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));
    };

    // Simple drag-to-reorder
    const handleDragStart = (idx: number) => setDragIdx(idx);
    const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
    const handleDrop = (idx: number) => {
        if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDragOverIdx(null); return; }
        const next = [...columns];
        const [moved] = next.splice(dragIdx, 1);
        next.splice(idx, 0, moved);
        setColumns(next);
        setDragIdx(null);
        setDragOverIdx(null);
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateKanbanColumnsAction(columns);
            if (result.error) toast.error(result.error);
            else toast.success("Colonnes Kanban sauvegardées !");
        });
    };

    const handleReset = () => {
        setColumns(DEFAULT_KANBAN_COLUMNS);
        toast.info("Colonnes remises par défaut (non sauvegardé)");
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {columns.map((col, idx) => (
                    <div
                        key={col.id}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={() => handleDrop(idx)}
                        onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                        className={`flex items-center gap-2 p-2 rounded-lg border bg-white transition-all ${dragOverIdx === idx ? "border-primary/50 bg-primary/5 scale-[1.01]" : "border-border"
                            }`}
                    >
                        {/* Drag handle */}
                        <button className="text-muted-foreground cursor-grab active:cursor-grabbing shrink-0">
                            <GripVertical className="h-4 w-4" />
                        </button>

                        {/* Color picker */}
                        <ColorPicker
                            value={col.color}
                            onChange={(color) => updateColumn(idx, { color })}
                        />

                        {/* Label */}
                        <Input
                            value={col.label}
                            onChange={(e) => updateColumn(idx, { label: e.target.value })}
                            className="h-8 text-sm flex-1"
                            placeholder="Nom de l'étape..."
                        />

                        {/* Delete */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeColumn(idx)}
                            disabled={columns.length <= 1}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                ))}
            </div>

            {/* Add + Reset */}
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-sm" onClick={addColumn}>
                    <Plus className="h-3.5 w-3.5" /> Ajouter une étape
                </Button>
                <Button variant="ghost" size="sm" className="text-sm text-muted-foreground" onClick={handleReset}>
                    Réinitialiser
                </Button>
            </div>

            {/* Preview strip */}
            <div className="flex gap-2 flex-wrap pt-1">
                {columns.map((col) => (
                    <span
                        key={col.id}
                        className="text-xs px-2.5 py-1 rounded-full font-medium text-white"
                        style={{ backgroundColor: col.color }}
                    >
                        {col.label}
                    </span>
                ))}
            </div>

            {/* Save */}
            <div className="flex justify-end pt-2 border-t border-border">
                <Button onClick={handleSave} disabled={isPending} className="gap-2 bg-primary hover:bg-primary/90 text-white">
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Enregistrer les étapes
                </Button>
            </div>
        </div>
    );
}
