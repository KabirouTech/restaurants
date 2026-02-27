import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ExpectedColumn = {
    key: string;
    label: string;
    required?: boolean;
    aliases?: string[];
};

interface ColumnMapperProps {
    fileHeaders: string[];
    expectedColumns: ExpectedColumn[];
    onConfirm: (mapping: Record<string, string>) => void;
    onCancel: () => void;
}

export function ColumnMapper({ fileHeaders, expectedColumns, onConfirm, onCancel }: ColumnMapperProps) {
    const [mapping, setMapping] = useState<Record<string, string>>({});

    // Auto-map based on aliases or exact name
    useEffect(() => {
        const initialMapping: Record<string, string> = {};
        expectedColumns.forEach(exp => {
            const match = fileHeaders.find(h => {
                const headerLower = h.toLowerCase().trim();
                if (headerLower === exp.label.toLowerCase().trim()) return true;
                if (exp.aliases?.some(alias => headerLower.includes(alias.toLowerCase()))) return true;
                return false;
            });
            if (match) {
                initialMapping[exp.key] = match;
            }
        });
        setMapping(initialMapping);
    }, [fileHeaders, expectedColumns]);

    const handleConfirm = () => {
        // Validation: check if all required columns are mapped
        const missingRequired = expectedColumns.filter(c => c.required && !mapping[c.key]);
        if (missingRequired.length > 0) {
            // we could show a toast, but usually button is disabled
            return;
        }
        onConfirm(mapping);
    };

    const isReady = expectedColumns.filter(c => c.required).every(c => mapping[c.key]);

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <h4 className="font-semibold text-primary flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4" /> Correspondance des colonnes
                </h4>
                <p className="text-sm text-muted-foreground">
                    Associez les colonnes de votre fichier avec celles attendues par le système.
                </p>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {expectedColumns.map(exp => (
                    <div key={exp.key} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center bg-card p-3 rounded-lg border shadow-sm">
                        <div className="col-span-2 flex flex-col sm:border-r sm:pr-2">
                            <span className="text-sm font-medium flex items-center gap-1.5">
                                {exp.label} {exp.required && <span className="text-destructive text-xs">*</span>}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase mt-0.5 tracking-wider font-mono bg-muted inline-flex w-max px-1 rounded">
                                Système
                            </span>
                        </div>
                        <div className="hidden sm:flex col-span-1 justify-center">
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                            <Select
                                value={mapping[exp.key] || "none"}
                                onValueChange={(val) => setMapping(prev => ({ ...prev, [exp.key]: val === "none" ? "" : val }))}
                            >
                                <SelectTrigger className={cn("h-9 border-dashed font-medium text-sm", mapping[exp.key] && "border-solid border-primary text-primary")}>
                                    <SelectValue placeholder="Ignorer ou non trouvé" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" className="text-muted-foreground italic">-- Ignorer cette colonne --</SelectItem>
                                    {fileHeaders.map(h => (
                                        <SelectItem key={h} value={h}>{h}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                <Button variant="outline" onClick={onCancel}>Annuler</Button>
                <Button onClick={handleConfirm} disabled={!isReady} className="min-w-[120px]">
                    Confirmer
                </Button>
            </div>
        </div>
    );
}
