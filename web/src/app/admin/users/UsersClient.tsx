"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { UserDialog } from "@/components/admin/UserDialog";
import { deleteUserAction } from "@/actions/admin/users";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Users, Pencil, Trash2, Loader2, Search } from "lucide-react";

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
        case "admin":
            return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
        case "driver":
            return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
        default:
            return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
};

export function UsersClient({
    users,
    organizations,
}: {
    users: User[];
    organizations: Organization[];
}) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editUser, setEditUser] = useState<User | undefined>();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    const orgMap = Object.fromEntries(organizations.map(o => [o.id, o.name]));

    const filtered = users.filter(u => {
        const matchesSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

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

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans">
            <header className="h-20 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-8 z-10 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-foreground flex items-center gap-3">
                        <Users className="h-7 w-7 text-orange-500" />
                        Utilisateurs
                    </h1>
                    <p className="text-sm text-muted-foreground font-light">
                        {filtered.length} utilisateur{filtered.length > 1 ? "s" : ""}
                    </p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom..."
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
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="driver">Driver</option>
                    </select>
                </div>

                {/* Table */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-muted-foreground border-b border-border bg-muted/50">
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Nom</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Rôle</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Organisation</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Super Admin</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 font-semibold uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.length > 0 ? filtered.map((user) => (
                                    <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
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
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadge(user.role)}`}>
                                                {user.role || "staff"}
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
                                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
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
        </div>
    );
}
