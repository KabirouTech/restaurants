"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import * as XLSX from "xlsx";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { importRecipesAction, type RecipeImportRow } from "@/actions/recipes";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Download, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { ColumnMapper, ExpectedColumn } from "@/components/ui/column-mapper";

// ─── Parse helpers ────────────────────────────────────────────────────────────

function parseIngredients(raw: string): { name: string; quantity: string; unit: string }[] {
    if (!raw?.trim()) return [];
    return raw
        .split(/[;|]+/)
        .map(s => s.trim()).filter(Boolean)
        .map(item => {
            const m1 = item.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-Zéàèùâôîêûçœ.]+)?\s+(.+)$/);
            if (m1) return { quantity: m1[1], unit: m1[2]?.trim() || "pièce(s)", name: m1[3].trim() };
            const m2 = item.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)\s*([a-zA-Zéàèùâôîêûçœ.]+)?$/);
            if (m2) return { name: m2[1].trim(), quantity: m2[2], unit: m2[3]?.trim() || "pièce(s)" };
            return { name: item, quantity: "", unit: "pièce(s)" };
        });
}

function ingredientsToString(list: { name: string; quantity: string; unit: string }[]): string {
    return list.map(i => [i.quantity, i.unit, i.name].filter(Boolean).join(" ")).join("; ");
}

function parseTags(raw: string): string[] {
    if (!raw?.trim()) return [];
    return raw.split(/[,;]+/).map(t => t.trim().toLowerCase()).filter(Boolean);
}

function parseBoolean(raw: string): boolean {
    return /^(oui|yes|true|1|x)$/i.test(String(raw).trim());
}

function parseNumber(raw: string | number): number | null {
    const n = Number(String(raw).replace(",", "."));
    return isNaN(n) || n <= 0 ? null : Math.round(n);
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ParsedRow = RecipeImportRow & { _valid: boolean };
type EditTarget = { row: number; field: string } | null;

const EXPECTED_COLUMNS: ExpectedColumn[] = [
    { key: "name",               label: "Nom",                 required: true, aliases: ["nom","name","recette","titre","plat"] },
    { key: "description",        label: "Description",                         aliases: ["description","desc","résumé","présentation"] },
    { key: "category",           label: "Catégorie",                           aliases: ["catégorie","categorie","category","type"] },
    { key: "servings",           label: "Portions",                            aliases: ["portions","personnes","servings","pers","nb personnes"] },
    { key: "prep_time_minutes",  label: "Préparation (min)",                   aliases: ["préparation","preparation","prep","temps prépa","prep min","tps prépa"] },
    { key: "cook_time_minutes",  label: "Cuisson (min)",                       aliases: ["cuisson","cooking","cook","temps cuisson","cuisson min","tps cuisson"] },
    { key: "ingredients",        label: "Ingrédients",                         aliases: ["ingrédients","ingredients","composition","liste ingrédients"] },
    { key: "instructions",       label: "Instructions",                        aliases: ["instructions","étapes","étapes de préparation","préparation","procédé"] },
    { key: "tags",               label: "Tags",                                aliases: ["tags","mots-clés","étiquettes","labels"] },
    { key: "is_private",         label: "Privée (Oui/Non)",                    aliases: ["privée","privee","private","confidentiel","secret"] },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ImportRecipesDialog({
    open, onOpenChange, orgId,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    orgId: string;
}) {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

    const [status, setStatus] = useState<"upload" | "mapping" | "preview">("upload");
    const [rawRows, setRawRows] = useState<any[]>([]);
    const [fileHeaders, setFileHeaders] = useState<string[]>([]);
    const [rows, setRows] = useState<ParsedRow[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [isPending, startTransition] = useTransition();

    // ── Inline editing ──
    const [editing, setEditing] = useState<EditTarget>(null);
    const [editValue, setEditValue] = useState("");

    useEffect(() => {
        if (editing) {
            setTimeout(() => {
                editInputRef.current?.focus();
                editInputRef.current?.select();
            }, 0);
        }
    }, [editing]);

    function startEdit(rowIdx: number, field: string, currentStr: string) {
        setEditing({ row: rowIdx, field });
        setEditValue(currentStr);
    }

    function saveEdit() {
        if (!editing) return;
        const { row, field } = editing;
        setRows(prev => {
            const updated = [...prev];
            const r = { ...updated[row] };
            if      (field === "name")              { r.name = editValue.trim(); r._valid = !!r.name; }
            else if (field === "category")          { r.category = editValue.trim() || undefined; }
            else if (field === "servings")          { r.servings = parseNumber(editValue); }
            else if (field === "prep_time_minutes") { r.prep_time_minutes = parseNumber(editValue); }
            else if (field === "cook_time_minutes") { r.cook_time_minutes = parseNumber(editValue); }
            else if (field === "ingredients")       { r.ingredients_list = parseIngredients(editValue); }
            else if (field === "tags")              { r.tags = parseTags(editValue); }
            updated[row] = r;
            return updated;
        });
        setEditing(null);
    }

    function cancelEdit() {
        setEditing(null);
    }

    // ── File handling ──

    const reset = () => {
        setRows([]); setFileName(null); setStatus("upload");
        setRawRows([]); setFileHeaders([]); setEditing(null);
    };
    const close = () => { reset(); onOpenChange(false); };

    const handleFile = async (file: File) => {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!["xlsx", "xls", "csv"].includes(ext || "")) {
            toast.error("Format non supporté. Utilisez .xlsx, .xls ou .csv");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
                if (jsonRows.length === 0) { toast.error("Le fichier semble vide."); return; }
                setFileHeaders(Object.keys(jsonRows[0] as object));
                setRawRows(jsonRows);
                setFileName(file.name);
                setStatus("mapping");
            } catch {
                toast.error("Impossible de lire le fichier. Vérifiez le format.");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleMappingConfirm = (mapping: Record<string, string>) => {
        const parsed: ParsedRow[] = rawRows.map(row => {
            const get = (key: string) => String(row[mapping[key]] ?? "").trim();
            const name = get("name");
            return {
                name,
                description:        get("description") || undefined,
                category:           get("category") || undefined,
                servings:           parseNumber(get("servings")),
                prep_time_minutes:  parseNumber(get("prep_time_minutes")),
                cook_time_minutes:  parseNumber(get("cook_time_minutes")),
                ingredients_list:   parseIngredients(get("ingredients")),
                instructions:       get("instructions") || undefined,
                tags:               parseTags(get("tags")),
                is_private:         parseBoolean(get("is_private")),
                _valid:             !!name,
            };
        }).filter(r => Object.values(r).some(v => v));
        setRows(parsed);
        setStatus("preview");
    };

    const handleImport = () => {
        const valid = rows.filter(r => r._valid);
        startTransition(async () => {
            const res = await importRecipesAction(orgId, valid.map(({ _valid, ...r }) => r));
            if (res.error) { toast.error(res.error); }
            else {
                toast.success(`${res.count} recette(s) importée(s) avec succès !`);
                router.refresh();
                close();
            }
        });
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ["Nom","Description","Catégorie","Portions","Préparation (min)","Cuisson (min)","Ingrédients","Instructions","Tags","Privée (Oui/Non)"],
            ["Thiéboudienne au poisson","Plat traditionnel sénégalais à base de riz et poisson","Plat principal",4,20,60,"500 g poisson saint-pierre; 200 g riz cassé; 2 oignons; 3 c. à soupe huile","1. Nettoyer le poisson et couper en morceaux.\n2. Faire revenir les oignons dans l'huile.\n3. Ajouter le riz et couvrir d'eau.","sénégalais; poisson; traditionnel","Non"],
            ["Poulet yassa","Poulet mariné aux oignons et citron","Plat principal",6,30,45,"1 poulet entier; 4 oignons; 2 citrons; 3 c. à soupe moutarde; sel; poivre","1. Mariner le poulet une nuit.\n2. Griller le poulet 15 min.\n3. Cuire les oignons et ajouter le poulet.","poulet; citron; ivoirien","Non"],
        ]);
        ws["!cols"] = [{ wch:30},{wch:40},{wch:16},{wch:10},{wch:18},{wch:14},{wch:50},{wch:60},{wch:25},{wch:16}];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Recettes");
        XLSX.writeFile(wb, "modele_import_recettes.xlsx");
        toast.success("Modèle téléchargé !");
    };

    const validCount = rows.filter(r => r._valid).length;
    const invalidCount = rows.length - validCount;

    // ── Editable cell renderer ──────────────────────────────────────────────

    function EditableCell({
        rowIdx, field, display, editStr, type = "text", className,
    }: {
        rowIdx: number; field: string; display: React.ReactNode; editStr: string;
        type?: "text" | "number"; className?: string;
    }) {
        const isEditing = editing?.row === rowIdx && editing?.field === field;

        if (isEditing) {
            return (
                <input
                    ref={editInputRef}
                    type={type}
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={e => {
                        if (e.key === "Enter") { e.preventDefault(); saveEdit(); }
                        if (e.key === "Escape") cancelEdit();
                    }}
                    className={cn(
                        "w-full bg-primary/5 border border-primary rounded px-1.5 py-0.5 text-xs outline-none min-w-[60px]",
                        type === "number" && "w-16 text-center",
                        className
                    )}
                />
            );
        }

        return (
            <span
                className="group/cell relative cursor-pointer rounded px-0.5 hover:bg-primary/8 transition-colors flex items-center gap-1"
                onDoubleClick={() => startEdit(rowIdx, field, editStr)}
                title="Double-cliquez pour modifier"
            >
                <span className={cn(!display && "text-muted-foreground/30 italic")}>{display || "—"}</span>
                <Pencil className="h-2.5 w-2.5 text-muted-foreground/0 group-hover/cell:text-muted-foreground/50 shrink-0 transition-opacity" />
            </span>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90dvh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        Importer des recettes (Excel / CSV)
                    </DialogTitle>
                    <DialogDescription>
                        Téléchargez le modèle, remplissez-le, puis importez-le ici.
                        Colonne requise : <strong>Nom</strong>. Toutes les autres sont optionnelles.
                    </DialogDescription>
                </DialogHeader>

                {/* ── Étape 1 : Upload ── */}
                {status === "upload" && (
                    <div
                        className={cn(
                            "relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer",
                            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
                        )}
                        onDragOver={e => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileRef.current?.click()}
                    >
                        <Upload className={cn("h-10 w-10 transition-colors", dragging ? "text-primary" : "text-muted-foreground")} />
                        <div className="text-center">
                            <p className="font-semibold text-sm">Glissez votre fichier ici</p>
                            <p className="text-xs text-muted-foreground mt-1">ou cliquez pour sélectionner · .xlsx, .xls, .csv</p>
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                        />
                    </div>
                )}

                {/* ── Étape 2 : Mapping ── */}
                {status === "mapping" && (
                    <ColumnMapper
                        fileHeaders={fileHeaders}
                        expectedColumns={EXPECTED_COLUMNS}
                        onConfirm={handleMappingConfirm}
                        onCancel={reset}
                    />
                )}

                {/* ── Étape 3 : Preview éditable ── */}
                {status === "preview" && rows.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2 text-sm">
                                <FileSpreadsheet className="h-4 w-4 text-primary" />
                                <span className="font-medium truncate max-w-[200px]">{fileName}</span>
                                <Badge variant="secondary">{validCount} valides</Badge>
                                {invalidCount > 0 && <Badge variant="destructive">{invalidCount} ignorées</Badge>}
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reset}>
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        {/* Hint */}
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2 rounded-lg">
                            <Pencil className="h-3 w-3 text-blue-500 shrink-0" />
                            <span><strong>Double-cliquez</strong> sur n'importe quelle cellule pour corriger une valeur avant d'importer.</span>
                        </p>

                        <div className="overflow-auto rounded-lg border bg-card text-xs max-h-72">
                            <table className="w-full min-w-[700px]">
                                <thead className="bg-muted/50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold w-8" />
                                        <th className="px-3 py-2 text-left font-semibold">Nom *</th>
                                        <th className="px-3 py-2 text-left font-semibold w-28">Catégorie</th>
                                        <th className="px-3 py-2 text-center font-semibold w-16">Pers.</th>
                                        <th className="px-3 py-2 text-center font-semibold w-16">Prépa</th>
                                        <th className="px-3 py-2 text-center font-semibold w-16">Cuisson</th>
                                        <th className="px-3 py-2 text-left font-semibold">Ingrédients</th>
                                        <th className="px-3 py-2 text-left font-semibold">Tags</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, i) => (
                                        <tr key={i} className={cn(
                                            "border-t border-border/50 group",
                                            !row._valid && "bg-red-50/50 dark:bg-red-900/10"
                                        )}>
                                            {/* Statut */}
                                            <td className="px-3 py-2 text-center">
                                                {row._valid
                                                    ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 inline" />
                                                    : <AlertCircle className="h-3.5 w-3.5 text-red-400 inline" />
                                                }
                                            </td>

                                            {/* Nom */}
                                            <td className="px-3 py-2 font-medium max-w-[180px]">
                                                <EditableCell
                                                    rowIdx={i}
                                                    field="name"
                                                    display={row.name || <span className="text-red-400 italic text-xs">Manquant</span>}
                                                    editStr={row.name}
                                                />
                                            </td>

                                            {/* Catégorie */}
                                            <td className="px-3 py-2 text-muted-foreground">
                                                <EditableCell
                                                    rowIdx={i}
                                                    field="category"
                                                    display={row.category}
                                                    editStr={row.category || ""}
                                                />
                                            </td>

                                            {/* Portions */}
                                            <td className="px-3 py-2 text-center text-muted-foreground">
                                                <EditableCell
                                                    rowIdx={i}
                                                    field="servings"
                                                    display={row.servings ?? null}
                                                    editStr={row.servings?.toString() ?? ""}
                                                    type="number"
                                                />
                                            </td>

                                            {/* Prépa */}
                                            <td className="px-3 py-2 text-center text-muted-foreground">
                                                <EditableCell
                                                    rowIdx={i}
                                                    field="prep_time_minutes"
                                                    display={row.prep_time_minutes ? `${row.prep_time_minutes}'` : null}
                                                    editStr={row.prep_time_minutes?.toString() ?? ""}
                                                    type="number"
                                                />
                                            </td>

                                            {/* Cuisson */}
                                            <td className="px-3 py-2 text-center text-muted-foreground">
                                                <EditableCell
                                                    rowIdx={i}
                                                    field="cook_time_minutes"
                                                    display={row.cook_time_minutes ? `${row.cook_time_minutes}'` : null}
                                                    editStr={row.cook_time_minutes?.toString() ?? ""}
                                                    type="number"
                                                />
                                            </td>

                                            {/* Ingrédients */}
                                            <td className="px-3 py-2 text-muted-foreground max-w-[200px]">
                                                <EditableCell
                                                    rowIdx={i}
                                                    field="ingredients"
                                                    display={
                                                        row.ingredients_list?.length
                                                            ? <span className="truncate block max-w-[180px]" title={ingredientsToString(row.ingredients_list)}>
                                                                {row.ingredients_list.length} ingr.
                                                              </span>
                                                            : null
                                                    }
                                                    editStr={ingredientsToString(row.ingredients_list ?? [])}
                                                />
                                            </td>

                                            {/* Tags */}
                                            <td className="px-3 py-2 text-muted-foreground max-w-[160px]">
                                                <EditableCell
                                                    rowIdx={i}
                                                    field="tags"
                                                    display={row.tags?.length
                                                        ? row.tags.slice(0, 2).join(", ") + (row.tags.length > 2 ? `…` : "")
                                                        : null
                                                    }
                                                    editStr={row.tags?.join(", ") ?? ""}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {invalidCount > 0 && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                Les lignes sans <strong>Nom</strong> seront ignorées. Double-cliquez sur la cellule Nom pour la corriger.
                            </p>
                        )}
                    </div>
                )}

                {/* ── Footer ── */}
                {status !== "mapping" && (
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost" size="sm"
                            onClick={downloadTemplate}
                            className="mr-auto gap-1.5 text-muted-foreground"
                        >
                            <Download className="h-3.5 w-3.5" /> Télécharger le modèle
                        </Button>
                        <Button variant="outline" onClick={close}>Annuler</Button>
                        <Button
                            onClick={handleImport}
                            disabled={status !== "preview" || validCount === 0 || isPending}
                            className="gap-2"
                        >
                            {isPending ? "Import en cours..." : `Importer ${validCount} recette(s)`}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
