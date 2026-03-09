"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { bulkToggleOrgsActiveAction } from "@/actions/admin/organizations";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Building2, Search, Loader2, Power, PowerOff } from "lucide-react";
import Link from "next/link";

interface Organization {
    id: string;
    name: string;
    slug: string;
    subscription_plan: string | null;
    is_active: boolean | null;
    created_at: string;
}

const planBadge = (plan: string) => {
    switch (plan) {
        case "pro": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
        case "enterprise": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
        default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
};

export function OrganizationsClient({
    organizations,
    orderCountMap,
    initialSearch,
    initialPlan,
    initialStatus,
}: {
    organizations: Organization[];
    orderCountMap: Record<string, number>;
    initialSearch?: string;
    initialPlan?: string;
    initialStatus?: string;
}) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
    const [bulkAction, setBulkAction] = useState<"activate" | "deactivate">("deactivate");
    const [isPending, startTransition] = useTransition();

    const allSelected = organizations.length > 0 && organizations.every(o => selected.has(o.id));

    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (allSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(organizations.map(o => o.id)));
        }
    };

    const handleBulkToggle = (action: "activate" | "deactivate") => {
        setBulkAction(action);
        setBulkConfirmOpen(true);
    };

    const handleBulkConfirm = () => {
        startTransition(async () => {
            const result = await bulkToggleOrgsActiveAction(
                Array.from(selected),
                bulkAction === "activate"
            );
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(
                    `${selected.size} organisation${selected.size > 1 ? "s" : ""} ${bulkAction === "activate" ? "activée" : "désactivée"}${selected.size > 1 ? "s" : ""}`
                );
                setSelected(new Set());
            }
            setBulkConfirmOpen(false);
        });
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background text-foreground font-sans">
            <header className="h-14 md:h-20 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold font-serif text-foreground flex items-center gap-2 md:gap-3">
                        <Building2 className="h-5 w-5 md:h-7 md:w-7 text-orange-500" />
                        Organisations
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground font-light">{organizations.length} organisation{organizations.length > 1 ? "s" : ""}</p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                {/* Filters */}
                <form className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
                    <div className="relative flex-1 min-w-[160px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            name="search"
                            type="text"
                            placeholder="Rechercher par nom ou slug..."
                            defaultValue={initialSearch || ""}
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        />
                    </div>
                    <select
                        name="plan"
                        defaultValue={initialPlan || "all"}
                        className="border border-border rounded-lg px-3 py-2 bg-background text-sm"
                    >
                        <option value="all">Tous les plans</option>
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                    </select>
                    <select
                        name="status"
                        defaultValue={initialStatus || "all"}
                        className="border border-border rounded-lg px-3 py-2 bg-background text-sm"
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="active">Actif</option>
                        <option value="inactive">Inactif</option>
                    </select>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                    >
                        Filtrer
                    </button>
                </form>

                {/* Bulk action bar */}
                {selected.size > 0 && (
                    <div className="mb-4 flex flex-wrap items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                        <span className="text-xs md:text-sm font-medium text-orange-700 dark:text-orange-300">
                            {selected.size} sélectionnée{selected.size > 1 ? "s" : ""}
                        </span>
                        <div className="flex-1" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelected(new Set())}
                            className="text-muted-foreground text-xs h-7"
                        >
                            Désélectionner
                        </Button>
                        <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white text-xs h-7"
                            onClick={() => handleBulkToggle("activate")}
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Power className="h-3.5 w-3.5 mr-1" />}
                            Activer
                        </Button>
                        <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white text-xs h-7"
                            onClick={() => handleBulkToggle("deactivate")}
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <PowerOff className="h-3.5 w-3.5 mr-1" />}
                            Désactiver
                        </Button>
                    </div>
                )}

                {/* ── MOBILE: Compact list ──────────────────────── */}
                <div className="md:hidden bg-card rounded-xl border border-border overflow-hidden">
                    {organizations.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground text-sm">
                            Aucune organisation trouvée.
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {organizations.map((org) => (
                                <div
                                    key={org.id}
                                    className={`flex items-center gap-2.5 px-3 py-2.5 ${selected.has(org.id) ? "bg-orange-50/50 dark:bg-orange-950/10" : ""}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected.has(org.id)}
                                        onChange={() => toggleSelect(org.id)}
                                        className="h-3.5 w-3.5 rounded border-border accent-orange-500 shrink-0"
                                    />
                                    <Link href={`/admin/organizations/${org.id}`} className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-semibold truncate hover:text-orange-500 transition-colors">{org.name}</span>
                                            <span className={`px-1.5 py-0 rounded-full text-[9px] font-semibold shrink-0 ${planBadge(org.subscription_plan || "free")}`}>
                                                {org.subscription_plan || "free"}
                                            </span>
                                            <span className={`px-1.5 py-0 rounded-full text-[9px] font-semibold shrink-0 ${org.is_active !== false
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                }`}>
                                                {org.is_active !== false ? "Actif" : "Inactif"}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground truncate">
                                            /{org.slug} · {orderCountMap[org.id] || 0} cmd
                                        </p>
                                    </Link>
                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                        {org.created_at ? format(new Date(org.created_at), "d MMM yy", { locale: fr }) : "-"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── DESKTOP: Table layout ─────────────────────── */}
                <div className="hidden md:block bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-muted-foreground border-b border-border bg-muted/50">
                                    <th className="px-4 py-4 w-10">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={toggleAll}
                                            className="h-4 w-4 rounded border-border accent-orange-500"
                                        />
                                    </th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Nom</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Slug</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Plan</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Commandes</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Créé le</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {organizations.length > 0 ? organizations.map((org) => (
                                    <tr key={org.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${selected.has(org.id) ? "bg-orange-50/50 dark:bg-orange-950/10" : ""}`}>
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(org.id)}
                                                onChange={() => toggleSelect(org.id)}
                                                className="h-4 w-4 rounded border-border accent-orange-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={`/admin/organizations/${org.id}`} className="font-bold text-foreground hover:text-orange-500 transition-colors font-serif">
                                                {org.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs">/{org.slug}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${planBadge(org.subscription_plan || "free")}`}>
                                                {org.subscription_plan || "free"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${org.is_active !== false
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                }`}>
                                                {org.is_active !== false ? "Actif" : "Inactif"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">{orderCountMap[org.id] || 0}</td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {org.created_at ? format(new Date(org.created_at), "d MMM yyyy", { locale: fr }) : "-"}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                                            Aucune organisation trouvée.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={bulkConfirmOpen}
                onOpenChange={setBulkConfirmOpen}
                title={`${bulkAction === "activate" ? "Activer" : "Désactiver"} ${selected.size} organisation${selected.size > 1 ? "s" : ""} ?`}
                description={
                    bulkAction === "activate"
                        ? "Les organisations sélectionnées seront réactivées et leurs utilisateurs pourront y accéder."
                        : "Les organisations sélectionnées seront désactivées. Leurs utilisateurs ne pourront plus y accéder."
                }
                confirmLabel={`${bulkAction === "activate" ? "Activer" : "Désactiver"} (${selected.size})`}
                variant={bulkAction === "deactivate" ? "destructive" : "default"}
                onConfirm={handleBulkConfirm}
            />
        </div>
    );
}
