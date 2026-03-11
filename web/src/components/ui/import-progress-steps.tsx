import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ImportProgressPhase = "idle" | "running" | "success" | "error";

type ImportProgressStepsProps = {
    steps: string[];
    currentStep: number;
    phase?: ImportProgressPhase;
    processedCount?: number;
    totalCount?: number;
    className?: string;
};

function clampStep(step: number, max: number) {
    if (max <= 0) return 0;
    return Math.min(Math.max(step, 0), max - 1);
}

function progressPercent(
    step: number,
    total: number,
    phase: ImportProgressPhase,
    processedCount?: number,
    totalCount?: number
) {
    if (total <= 0) return 0;
    if (phase === "success") return 100;

    if (phase === "running" && typeof processedCount === "number" && typeof totalCount === "number" && totalCount > 0) {
        const chunkProgress = Math.max(0, Math.min(1, processedCount / totalCount));
        return Math.max(0, Math.min(95, ((step + chunkProgress) / total) * 100));
    }

    const base = ((step + (phase === "running" ? 0.75 : 0.45)) / total) * 100;
    return Math.max(0, Math.min(95, base));
}

export function ImportProgressSteps({
    steps,
    currentStep,
    phase = "idle",
    processedCount,
    totalCount,
    className,
}: ImportProgressStepsProps) {
    const safeStep = clampStep(currentStep, steps.length);
    const percent = progressPercent(safeStep, steps.length, phase, processedCount, totalCount);

    return (
        <div className={cn("rounded-lg border border-border bg-muted/20 p-3", className)}>
            <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-300",
                        phase === "error" ? "bg-destructive" : "bg-primary"
                    )}
                    style={{ width: `${percent}%` }}
                />
            </div>

            <div className="grid grid-cols-3 gap-2">
                {steps.map((label, index) => {
                    const done = phase === "success" || index < safeStep;
                    const active = index === safeStep && phase !== "success";
                    const errored = active && phase === "error";

                    return (
                        <div key={label} className="flex items-center gap-2 min-w-0">
                            <div
                                className={cn(
                                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                                    done && "border-primary bg-primary text-primary-foreground",
                                    active && !errored && "border-primary text-primary",
                                    errored && "border-destructive bg-destructive text-destructive-foreground",
                                    !done && !active && "border-border text-muted-foreground"
                                )}
                            >
                                {done ? <Check className="h-3 w-3" /> : index + 1}
                            </div>
                            <span
                                className={cn(
                                    "truncate text-[11px]",
                                    active ? "text-foreground" : "text-muted-foreground"
                                )}
                            >
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {typeof totalCount === "number" && totalCount > 0 && (
                <p className="mt-3 text-[11px] text-muted-foreground">
                    {phase === "running" && typeof processedCount === "number"
                        ? `${processedCount}/${totalCount} lignes traitées`
                        : phase === "success"
                            ? `${totalCount}/${totalCount} lignes traitées`
                            : `${totalCount} lignes prêtes à importer`}
                </p>
            )}
        </div>
    );
}
