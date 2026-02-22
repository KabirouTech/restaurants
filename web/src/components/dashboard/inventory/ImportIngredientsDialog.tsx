"use client";

import { useRef, useState, useTransition } from "react";
import * as XLSX from "xlsx";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { importIngredientsAction } from "@/actions/ingredients";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Download } from "lucide-react";
import { cn } from "@/lib/utils";

type Supplier = {
    id: string;
    name: string;
};

type ParsedRow = {
    name: string;
    category?: string;
    unit?: string;
    current_stock?: number;
    low_stock_threshold?: number;
    cost_per_unit?: number;
    supplier_name?: string;
    supplier_id?: string;
    _valid: boolean;
};

const COL_MAP: Record<string, string> = {
    nom: "name", name: "name", "ingrédient": "name", ingredient: "name",
    "catégorie": "category", category: "category", type: "category",
    "unité": "unit", unit: "unit", mesure: "unit",
    stock: "current_stock", "quantité": "current_stock", quantity: "current_stock", "stock actuel": "current_stock",
    seuil: "low_stock_threshold", threshold: "low_stock_threshold", "seuil bas": "low_stock_threshold", alerte: "low_stock_threshold",
    "coût": "cost_per_unit", cost: "cost_per_unit", prix: "cost_per_unit", "prix unitaire": "cost_per_unit", cost_per_unit: "cost_per_unit",
    fournisseur: "supplier_name", supplier: "supplier_name",
};

function normalizeKey(key: string): string | null {
    return COL_MAP[key.toLowerCase().trim()] ?? null;
}

function parseSheet(file: File, suppliers: Supplier[]): Promise<ParsedRow[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

                const supplierMap = new Map(suppliers.map(s => [s.name.toLowerCase(), s.id]));

                const parsed: ParsedRow[] = jsonRows.map((row) => {
                    const out: Record<string, any> = {};
                    for (const key of Object.keys(row)) {
                        const mapped = normalizeKey(key);
                        if (mapped && mapped !== "_valid") {
                            const val = String(row[key] ?? "").trim();
                            if (["current_stock", "low_stock_threshold", "cost_per_unit"].includes(mapped)) {
                                out[mapped] = parseFloat(val) || 0;
                            } else {
                                out[mapped] = val || undefined;
                            }
                        }
                    }

                    // Match supplier by name
                    if (out.supplier_name) {
                        const matchedId = supplierMap.get(out.supplier_name.toLowerCase());
                        if (matchedId) {
                            out.supplier_id = matchedId;
                        }
                    }

                    return { ...out, _valid: !!out.name?.trim() } as ParsedRow;
                });

                resolve(parsed.filter(r => Object.values(r).some(v => v)));
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

export function ImportIngredientsDialog({ open, onOpenChange, suppliers }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    suppliers: Supplier[];
}) {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const [rows, setRows] = useState<ParsedRow[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [isPending, startTransition] = useTransition();

    const reset = () => { setRows([]); setFileName(null); };
    const close = () => { reset(); onOpenChange(false); };

    const handleFile = async (file: File) => {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!["xlsx", "xls", "csv"].includes(ext || "")) {
            toast.error("Format non supporté. Utilisez .xlsx, .xls ou .csv");
            return;
        }
        try {
            const parsed = await parseSheet(file, suppliers);
            setRows(parsed);
            setFileName(file.name);
        } catch {
            toast.error("Impossible de lire le fichier. Vérifiez le format.");
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleImport = () => {
        const validRows = rows.filter(r => r._valid);
        startTransition(async () => {
            const payload = validRows.map(({ _valid, supplier_name, ...r }) => r);
            const result = await importIngredientsAction(payload);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`${result.count} ingrédient(s) importé(s) avec succès !`);
                router.refresh();
                close();
            }
        });
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ["Nom", "Catégorie", "Unité", "Stock", "Seuil", "Coût unitaire", "Fournisseur"],
            ["Tomates cerises", "Légumes", "kg", "15", "5", "3.50", "Metro"],
            ["Filet de boeuf", "Viandes", "kg", "8", "3", "25.00", "Rungis Express"],
            ["Huile d'olive", "Épices", "L", "20", "5", "8.90", ""],
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ingrédients");
        XLSX.writeFile(wb, "modele_import_ingredients.xlsx");
    };

    const validCount = rows.filter(r => r._valid).length;
    const invalidCount = rows.length - validCount;

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        Importer des ingrédients (Excel / CSV)
                    </DialogTitle>
                    <DialogDescription>
                        Uploadez un fichier avec les colonnes : <strong>Nom</strong>, Catégorie, Unité, Stock, Seuil, Coût unitaire, Fournisseur.
                    </DialogDescription>
                </DialogHeader>

                {!rows.length && (
                    <div
                        className={cn(
                            "relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer",
                            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
                        )}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileRef.current?.click()}
                    >
                        <Upload className={cn("h-10 w-10 transition-colors", dragging ? "text-primary" : "text-muted-foreground")} />
                        <div className="text-center">
                            <p className="font-semibold text-sm">Glissez votre fichier ici</p>
                            <p className="text-xs text-muted-foreground mt-1">ou cliquez pour sélectionner un fichier .xlsx, .xls, .csv</p>
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                        />
                    </div>
                )}

                {rows.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2 text-sm">
                                <FileSpreadsheet className="h-4 w-4 text-primary" />
                                <span className="font-medium truncate max-w-[200px]">{fileName}</span>
                                <Badge variant="secondary">{validCount} valides</Badge>
                                {invalidCount > 0 && (
                                    <Badge variant="destructive">{invalidCount} ignorées</Badge>
                                )}
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reset}>
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        <div className="max-h-64 overflow-y-auto rounded-lg border bg-card text-xs">
                            <table className="w-full">
                                <thead className="bg-muted/50 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold">Statut</th>
                                        <th className="px-3 py-2 text-left font-semibold">Nom</th>
                                        <th className="px-3 py-2 text-left font-semibold">Catégorie</th>
                                        <th className="px-3 py-2 text-left font-semibold">Stock</th>
                                        <th className="px-3 py-2 text-left font-semibold">Fournisseur</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, i) => (
                                        <tr key={i} className={cn(
                                            "border-t border-border/50",
                                            !row._valid && "opacity-50 bg-red-50 dark:bg-red-900/20"
                                        )}>
                                            <td className="px-3 py-2">
                                                {row._valid
                                                    ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                                    : <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                                                }
                                            </td>
                                            <td className="px-3 py-2 font-medium">{row.name || <span className="text-red-400 italic">Manquant</span>}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{row.category || "-"}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{row.current_stock ?? "-"} {row.unit || ""}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{row.supplier_name || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {invalidCount > 0 && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                Les lignes sans <strong>Nom</strong> seront ignorées lors de l&apos;import.
                            </p>
                        )}
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" size="sm" onClick={downloadTemplate} className="mr-auto gap-1.5 text-muted-foreground">
                        <Download className="h-3.5 w-3.5" /> Télécharger le modèle
                    </Button>
                    <Button variant="outline" onClick={close}>Annuler</Button>
                    <Button
                        onClick={handleImport}
                        disabled={validCount === 0 || isPending}
                        className="gap-2"
                    >
                        {isPending ? "Import en cours..." : `Importer ${validCount} ingrédient(s)`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
