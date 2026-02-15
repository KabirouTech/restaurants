"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UploadCloud, CheckCircle, AlertCircle, FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from 'xlsx';
import { importMenuAction } from "@/actions/import";

export function ImportMenuDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [message, setMessage] = useState<string | null>(null);

    const handleDownloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            { "Nom du Plat": "Thiéboudienne", "Prix": 15.00, "Catégorie": "Plat", "Description": "Riz, poisson, légumes", "Image URL": "" },
            { "Nom du Plat": "Yassa Poulet", "Prix": 12.50, "Catégorie": "Plat", "Description": "Poulet aux oignons", "Image URL": "" },
            { "Nom du Plat": "Bissap", "Prix": 3.00, "Catégorie": "Boisson", "Description": "Jus d'hibiscus", "Image URL": "" }
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Menu");
        XLSX.writeFile(wb, "Modele_Menu_RestaurantOS.xlsx");
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setStatus("idle");
        setMessage(null);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];

                // Convert to JSON (plain objects)
                // Use default options to get plain objects
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    setStatus("error");
                    setMessage("Le fichier semble vide.");
                    setLoading(false);
                    return;
                }

                // Ensure data is plain JSON (remove any potential non-serializable stuff)
                const plainData = JSON.parse(JSON.stringify(data));

                const result = await importMenuAction(plainData);

                if (result.error) {
                    setStatus("error");
                    setMessage(result.error);
                } else {
                    setStatus("success");
                    setMessage(`${result.count} plats importés avec succès !`);
                    // Delay close slightly
                    setTimeout(() => setOpen(false), 2000);
                }
            } catch (err: any) {
                setStatus("error");
                setMessage("Erreur de lecture du fichier: " + err.message);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="ml-2 gap-2 border-dashed border-primary/30 text-primary hover:bg-primary/5">
                    <FileSpreadsheet className="h-4 w-4" /> Import Excel
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-serif text-xl">Importer votre Menu</DialogTitle>
                    <DialogDescription>
                        Gagnez du temps en important votre carte depuis un fichier Excel.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Step 1: Download Template */}
                    <div className="bg-muted/30 p-4 rounded-lg border border-border flex items-start gap-4">
                        <div className="h-10 w-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center shrink-0">
                            <FileSpreadsheet className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-medium text-sm">1. Télécharger le modèle</h4>
                            <p className="text-xs text-muted-foreground mb-2">Utilisez notre fichier Excel pré-formaté.</p>
                            <Button variant="link" onClick={handleDownloadTemplate} className="h-auto p-0 text-primary text-xs font-semibold">
                                Télécharger le modèle (.xlsx)
                            </Button>
                        </div>
                    </div>

                    {/* Step 2: Upload */}
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/10 transition-colors relative">
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={handleFileUpload}
                            disabled={loading}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />

                        {loading ? (
                            <div className="flex flex-col items-center gap-2 text-primary">
                                <Loader2 className="h-8 w-8 animate-spin" />
                                <span className="text-sm font-medium">Importation en cours...</span>
                            </div>
                        ) : status === "success" ? (
                            <div className="flex flex-col items-center gap-2 text-green-600">
                                <CheckCircle className="h-8 w-8" />
                                <span className="text-sm font-medium">{message}</span>
                            </div>
                        ) : status === "error" ? (
                            <div className="flex flex-col items-center gap-2 text-destructive">
                                <AlertCircle className="h-8 w-8" />
                                <span className="text-sm font-medium">{message}</span>
                                <span className="text-xs text-muted-foreground">Cliquez pour réessayer</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <UploadCloud className="h-8 w-8" />
                                <span className="text-sm font-medium">Glissez votre fichier ici</span>
                                <span className="text-xs">ou cliquez pour parcourir (.xlsx)</span>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
