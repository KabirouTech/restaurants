"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { UserDialog } from "@/components/admin/UserDialog";
import { deleteUserAction, bulkDeleteUsersAction } from "@/actions/admin/users";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Users, Pencil, Trash2, Loader2, Search, Mail } from "lucide-react";

interface User {
    id: string;
    full_name: string | null;
    role: string | null;
    organization_id: string | null;
    avatar_url: string | null;
    created_at: string;
    is_super_admin: boolean | null;
}

interface Organization {
    id: string;
    name: string;
}

const roleBadge = (role: string | null) => {
    switch (role) {
        case "superadmin":
            return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
        case "admin":
            return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
        case "member":
            return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
        default:
            return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
};

export function UsersClient({
    users,
    organizations,
    emailMap = {},
}: {
    users: User[];
    organizations: Organization[];
    emailMap?: Record<string, string>;
}) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editUser, setEditUser] = useState<User | undefined>();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    const orgMap = Object.fromEntries(organizations.map(o => [o.id, o.name]));

    const filtered = users.filter(u => {
        const matchesSearch = !search ||
            u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            emailMap[u.id]?.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const allFilteredSelected = filtered.length > 0 && filtered.every(u => selected.has(u.id));

    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (allFilteredSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(filtered.map(u => u.id)));
        }
    };

    const handleEdit = (user: User) => {
        setEditUser(user);
        setDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setDeleteTarget(id);
        setConfirmOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        setDeletingId(deleteTarget);
        setConfirmOpen(false);
        startTransition(async () => {
            const result = await deleteUserAction(deleteTarget);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Utilisateur supprimé");
            }
            setDeletingId(null);
            setDeleteTarget(null);
        });
    };

    const handleBulkDelete = () => {
        setBulkDeleting(true);
        startTransition(async () => {
            const result = await bulkDeleteUsersAction(Array.from(selected));
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`${selected.size} utilisateur${selected.size > 1 ? "s" : ""} supprimé${selected.size > 1 ? "s" : ""}`);
                setSelected(new Set());
            }
            setBulkDeleting(false);
            setBulkConfirmOpen(false);
        });
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background text-foreground font-sans">
            <header className="h-14 md:h-20 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-4 md:px-8 z-10 shrink-0">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold font-serif text-foreground flex items-center gap-2 md:gap-3">
                        <Users className="h-5 w-5 md:h-7 md:w-7 text-orange-500" />
                        Utilisateurs
                    </h1>
                    <p className="text-xs md:text-sm text-muted-foreground font-light">
                        {filtered.length} utilisateur{filtered.length > 1 ? "s" : ""}
                    </p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
                    <div className="relative flex-1 min-w-[160px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom ou email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="border border-border rounded-lg px-3 py-2 bg-background text-sm"
                    >
                        <option value="all">Tous les rôles</option>
                        <option value="superadmin">Super Admin</option>
                        <option value="admin">Admin</option>
                        <option value="member">Membre</option>
                    </select>
                </div>

                {/* Bulk action bar */}
                {selected.size > 0 && (
                    <div className="mb-4 flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                        <span className="text-xs md:text-sm font-medium text-orange-700 dark:text-orange-300">
                            {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
                        </span>
                        <div className="flex-1" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelected(new Set())}
                            className="text-muted-foreground text-xs md:text-sm h-7 md:h-8"
                        >
                            Désélectionner
                        </Button>
                        <Button
                            size="sm"
                            className="bg-red-500 hover:bg-red-600 text-white text-xs md:text-sm h-7 md:h-8"
                            onClick={() => setBulkConfirmOpen(true)}
                            disabled={bulkDeleting}
                        >
                            {bulkDeleting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                            Supprimer ({selected.size})
                        </Button>
                    </div>
                )}

                {/* ── MOBILE: Compact list ──────────────────────── */}
                <div className="md:hidden bg-card rounded-xl border border-border overflow-hidden">
                    {filtered.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground text-sm">
                            Aucun utilisateur trouvé.
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {filtered.map((user) => (
                                <div
                                    key={user.id}
                                    className={`flex items-center gap-2.5 px-3 py-2.5 ${selected.has(user.id) ? "bg-orange-50/50 dark:bg-orange-950/10" : ""}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected.has(user.id)}
                                        onChange={() => toggleSelect(user.id)}
                                        className="h-3.5 w-3.5 rounded border-border accent-orange-500 shrink-0"
                                    />
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 text-xs font-bold shrink-0">
                                            {user.full_name?.[0]?.toUpperCase() || "?"}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm font-semibold truncate">{user.full_name || "Sans nom"}</span>
                                            <span className={`px-1.5 py-0 rounded-full text-[9px] font-semibold shrink-0 ${roleBadge(user.role)}`}>
                                                {user.role || "member"}
                                            </span>
                                            {user.is_super_admin && (
                                                <span className="px-1.5 py-0 rounded-full text-[9px] font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 shrink-0">SA</span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground truncate">
                                            {emailMap[user.id] || (user.organization_id ? orgMap[user.organization_id] : "—")}
                                        </p>
                                    </div>
                                    <div className="flex gap-0.5 shrink-0">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(user)}>
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost" size="icon"
                                            className="h-7 w-7 text-red-500"
                                            onClick={() => handleDeleteClick(user.id)}
                                            disabled={deletingId === user.id}
                                        >
                                            {deletingId === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                        </Button>
                                    </div>
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
                                            checked={allFilteredSelected}
                                            onChange={toggleAll}
                                            className="h-4 w-4 rounded border-border accent-orange-500"
                                        />
                                    </th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Nom</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Rôle</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Organisation</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Super Admin</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.length > 0 ? filtered.map((user) => (
                                    <tr key={user.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${selected.has(user.id) ? "bg-orange-50/50 dark:bg-orange-950/10" : ""}`}>
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(user.id)}
                                                onChange={() => toggleSelect(user.id)}
                                                className="h-4 w-4 rounded border-border accent-orange-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {user.avatar_url ? (
                                                    <img
                                                        src={user.avatar_url}
                                                        alt=""
                                                        className="w-8 h-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 text-xs font-bold">
                                                        {user.full_name?.[0]?.toUpperCase() || "?"}
                                                    </div>
                                                )}
                                                <span className="font-bold text-foreground font-serif">
                                                    {user.full_name || "Sans nom"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground text-xs">
                                            {emailMap[user.id] || "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadge(user.role)}`}>
                                                {user.role || "member"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {user.organization_id ? orgMap[user.organization_id] || "—" : "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.is_super_admin ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                                    Super Admin
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {user.created_at
                                                ? format(new Date(user.created_at), "d MMM yyyy", { locale: fr })
                                                : "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleEdit(user)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                    onClick={() => handleDeleteClick(user.id)}
                                                    disabled={deletingId === user.id}
                                                >
                                                    {deletingId === user.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                                            Aucun utilisateur trouvé.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <UserDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                user={editUser}
                organizations={organizations}
            />

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Supprimer cet utilisateur ?"
                description="Cette action supprimera définitivement le profil et le compte d'authentification de l'utilisateur."
                confirmLabel="Supprimer"
                variant="destructive"
                onConfirm={handleDeleteConfirm}
            />

            <ConfirmDialog
                open={bulkConfirmOpen}
                onOpenChange={setBulkConfirmOpen}
                title={`Supprimer ${selected.size} utilisateur${selected.size > 1 ? "s" : ""} ?`}
                description="Cette action supprimera définitivement les profils et comptes d'authentification sélectionnés. Cette action est irréversible."
                confirmLabel={`Supprimer (${selected.size})`}
                variant="destructive"
                onConfirm={handleBulkDelete}
            />
        </div>
    );
}
