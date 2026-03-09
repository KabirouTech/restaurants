"use client";

import { useRef, useState, useTransition } from "react";
import * as XLSX from "xlsx";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { importCustomersAction } from "@/actions/customers";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { ColumnMapper, ExpectedColumn } from "@/components/ui/column-mapper";

type ParsedRow = {
    full_name: string;
    email?: string;
    phone?: string;
    notes?: string;
    source?: string;
    _valid: boolean;
};


export function ImportCustomersDialog({ open, onOpenChange }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<"upload" | "mapping" | "preview">("upload");
    const [rawRows, setRawRows] = useState<any[]>([]);
    const [fileHeaders, setFileHeaders] = useState<string[]>([]);
    const [rows, setRows] = useState<ParsedRow[]>([]);
    const [fileName, setFileName] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [isPending, startTransition] = useTransition();

    const EXPECTED_COLUMNS: ExpectedColumn[] = [
        { key: "full_name", label: "Nom complet", required: true, aliases: ["nom", "name", "prenom", "client"] },
        { key: "email", label: "Email", aliases: ["email", "e-mail", "mail", "courriel"] },
        { key: "phone", label: "Téléphone", aliases: ["téléphone", "telephone", "phone", "tel", "mobile"] },
        { key: "notes", label: "Notes", aliases: ["notes", "note", "commentaires", "commentaire", "remarques"] },
        { key: "source", label: "Source", aliases: ["source", "canal", "origine", "provenance"] },
    ];

    const reset = () => { setRows([]); setFileName(null); setStatus("upload"); setRawRows([]); setFileHeaders([]); };
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

                if (jsonRows.length === 0) {
                    toast.error("Le fichier semble vide.");
                    return;
                }

                const headers = Object.keys(jsonRows[0] as object);
                setFileHeaders(headers);
                setRawRows(jsonRows);
                setFileName(file.name);
                setStatus("mapping");
            } catch {
                toast.error("Impossible de lire le fichier. Vérifiez le format.");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleMappingConfirm = (mapping: Record<string, string>) => {
        const parsed: ParsedRow[] = rawRows.map(row => {
            const out: Partial<ParsedRow> = {};
            EXPECTED_COLUMNS.forEach(col => {
                const fileHeader = mapping[col.key];
                if (fileHeader) {
                    out[col.key as keyof ParsedRow] = String(row[fileHeader] ?? "").trim() as any;
                }
            });
            return { ...out, _valid: !!out.full_name?.trim() } as ParsedRow;
        });

        setRows(parsed.filter(r => Object.values(r).some(v => v)));
        setStatus("preview");
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
            const result = await importCustomersAction(validRows.map(({ _valid, ...r }) => r));
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`${result.count} client(s) importé(s) avec succès !`);
                router.refresh();
                close();
            }
        });
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ["Nom Complet", "Email", "Téléphone", "Notes", "Source"],
            ["Jean Dupont", "jean@example.com", "06 12 34 56 78", "Client fidèle", "whatsapp"],
            ["Marie Martin", "marie@example.com", "07 98 76 54 32", "", "instagram"],
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Clients");
        XLSX.writeFile(wb, "modele_import_clients.xlsx");
    };

    const validCount = rows.filter(r => r._valid).length;
    const invalidCount = rows.length - validCount;

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        Importer des clients (Excel / CSV)
                    </DialogTitle>
                    <DialogDescription>
                        Uploadez un fichier Excel ou CSV avec les colonnes : <strong>Nom</strong>, Email, Téléphone, Notes, Source.
                    </DialogDescription>
                </DialogHeader>

                {status === "mapping" && (
                    <ColumnMapper
                        fileHeaders={fileHeaders}
                        expectedColumns={EXPECTED_COLUMNS}
                        onConfirm={handleMappingConfirm}
                        onCancel={reset}
                    />
                )}

                {/* Drop zone */}
                {status === "upload" && !rows.length && (
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

                {/* Preview */}
                {status === "preview" && rows.length > 0 && (
                    <div className="space-y-3">
                        {/* File info bar */}
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

                        {/* Rows preview */}
                        <div className="max-h-64 overflow-y-auto rounded-lg border bg-card text-xs">
                            <table className="w-full">
                                <thead className="bg-muted/50 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold">Statut</th>
                                        <th className="px-3 py-2 text-left font-semibold">Nom</th>
                                        <th className="px-3 py-2 text-left font-semibold">Email</th>
                                        <th className="px-3 py-2 text-left font-semibold">Téléphone</th>
                                        <th className="px-3 py-2 text-left font-semibold">Source</th>
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
                                            <td className="px-3 py-2 font-medium">{row.full_name || <span className="text-red-400 italic">Manquant</span>}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{row.email || "-"}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{row.phone || "-"}</td>
                                            <td className="px-3 py-2 text-muted-foreground">{row.source || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {invalidCount > 0 && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                                Les lignes sans <strong>Nom</strong> seront ignorées lors de l'import.
                            </p>
                        )}
                    </div>
                )}

                {status !== "mapping" && (
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" size="sm" onClick={downloadTemplate} className="mr-auto gap-1.5 text-muted-foreground">
                            <Download className="h-3.5 w-3.5" /> Télécharger le modèle
                        </Button>
                        <Button variant="outline" onClick={close}>Annuler</Button>
                        <Button
                            onClick={handleImport}
                            disabled={status !== "preview" || validCount === 0 || isPending}
                            className="gap-2"
                        >
                            {isPending ? "Import en cours..." : `Importer ${validCount} client(s)`}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
