"use client";

import { useRef, useState, useTransition } from "react";
import * as XLSX from "xlsx";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { importSuppliersAction } from "@/actions/suppliers";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Download } from "lucide-react";
import { cn } from "@/lib/utils";

type ParsedRow = {
    name: string;
    contact_name?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    _valid: boolean;
};

const COL_MAP: Record<string, keyof ParsedRow> = {
    nom: "name", name: "name", "raison sociale": "name", entreprise: "name",
    contact: "contact_name", contact_name: "contact_name", "nom du contact": "contact_name", interlocuteur: "contact_name",
    email: "email", "e-mail": "email", mail: "email", courriel: "email",
    phone: "phone", telephone: "phone", "téléphone": "phone", tel: "phone", mobile: "phone",
    address: "address", adresse: "address",
    notes: "notes", remarques: "notes", commentaires: "notes",
};

function normalizeKey(key: string): keyof ParsedRow | null {
    return COL_MAP[key.toLowerCase().trim()] ?? null;
}

function parseSheet(file: File): Promise<ParsedRow[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target!.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

                const parsed: ParsedRow[] = jsonRows.map((row) => {
                    const out: Partial<ParsedRow> = {};
                    for (const key of Object.keys(row)) {
                        const mapped = normalizeKey(key);
                        if (mapped && mapped !== "_valid") {
                            out[mapped] = String(row[key] ?? "").trim() || undefined;
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

export function ImportSuppliersDialog({ open, onOpenChange }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
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
            const parsed = await parseSheet(file);
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
            const result = await importSuppliersAction(validRows.map(({ _valid, ...r }) => r));
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`${result.count} fournisseur(s) importé(s) avec succès !`);
                router.refresh();
                close();
            }
        });
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ["Nom", "Contact", "Email", "Téléphone", "Adresse", "Notes"],
            ["Metro", "Jean Dupont", "jean@metro.fr", "01 23 45 67 89", "123 Rue du Commerce, Paris", "Livraison le mardi"],
            ["Rungis Express", "Marie Martin", "marie@rungis.fr", "01 98 76 54 32", "MIN de Rungis", ""],
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Fournisseurs");
        XLSX.writeFile(wb, "modele_import_fournisseurs.xlsx");
    };

    const validCount = rows.filter(r => r._valid).length;
    const invalidCount = rows.length - validCount;

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        Importer des fournisseurs (Excel / CSV)
                    </DialogTitle>
                    <DialogDescription>
                        Uploadez un fichier Excel ou CSV avec les colonnes : <strong>Nom</strong>, Contact, Email, Téléphone, Adresse, Notes.
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
                                        <th className="px-3 py-2 text-left font-semibold">Contact</th>
                                        <th className="px-3 py-2 text-left font-semibold">Email</th>
                                        <th className="px-3 py-2 text-left font-semibold">Téléphone</th>
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
                                            <td className="px-3 py-2 text-muted-foreground">{row.contact_name || "-"}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{row.email || "-"}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{row.phone || "-"}</td>
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
                        {isPending ? "Import en cours..." : `Importer ${validCount} fournisseur(s)`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
