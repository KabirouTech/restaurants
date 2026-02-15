"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { checkCapacityAction, type AvailabilityResponse } from "@/actions/checkCapacity";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface CapacityMeterProps {
    organizationId: string;
}

export function CapacityMeter({ organizationId }: CapacityMeterProps) {
    const [data, setData] = useState<AvailabilityResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Default to Next Saturday for demo purposes, or Today
    const today = new Date();
    if (today.getDay() === 0) today.setDate(today.getDate() + 1);

    const checkDate = format(today, "yyyy-MM-dd");
    const displayDate = format(today, "EEE d MMM", { locale: fr });

    useEffect(() => {
        if (!organizationId) return;

        async function fetchData() {
            setIsLoading(true);
            try {
                const res = await checkCapacityAction({
                    organizationId: organizationId,
                    checkDate: checkDate,
                    loadCost: 0,
                });

                if (res.error) {
                    setError(res.error);
                } else {
                    setData(res);
                }
            } catch (e) {
                setError("Failed to fetch");
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [checkDate, organizationId]);

    const isEmpty = !isLoading && !error && (!data || data.maxLimit === 0);
    const currentLoad = data?.currentLoad || 0;
    const maxLimit = data?.maxLimit || 100;
    const percentage = maxLimit > 0 ? Math.round((currentLoad / maxLimit) * 100) : 0;

    const width = percentage > 100 ? 100 : percentage;

    return (
        <Card className="h-full bg-white border border-border shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all flex flex-col justify-between overflow-hidden">
            <CardHeader className="bg-muted/10 pb-4 border-b border-border/50">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 font-sans">Production</p>
                        <CardTitle className="text-xl font-bold text-secondary tracking-tight font-serif">
                            {isEmpty ? "Non Configuré" : `${percentage}% Charge`}
                        </CardTitle>
                    </div>
                    <span className="text-xs font-medium bg-background border border-border text-foreground px-2 py-1 rounded shadow-sm">
                        Aujourd'hui
                    </span>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
                {/* Minimalist Bar */}
                <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${percentage > 80 ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${width}%` }}
                    ></div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                    <div className="bg-muted/20 p-2 rounded-lg">
                        <p className="text-muted-foreground mb-1">Utilisé</p>
                        <p className="text-lg text-secondary font-bold font-serif">{currentLoad} pts</p>
                    </div>
                    <div className="bg-muted/20 p-2 rounded-lg">
                        <p className="text-muted-foreground mb-1">Capacité Max</p>
                        <p className="text-lg text-secondary font-bold font-serif">{maxLimit} pts</p>
                    </div>
                </div>

                <div className="text-xs font-medium text-muted-foreground border-t border-border pt-4 flex items-center justify-between">
                    <span>État du service</span>
                    <span className={percentage > 80 ? "text-destructive font-bold" : "text-primary font-bold"}>
                        {percentage > 80 ? "Surchargé" : "Opérationnel"}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
