"use client";

import { useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { updateUserAction } from "@/actions/admin/users";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: {
        id: string;
        full_name: string | null;
        role: string | null;
        organization_id: string | null;
        is_super_admin: boolean | null;
    };
    organizations: { id: string; name: string }[];
}

export function UserDialog({ open, onOpenChange, user, organizations }: UserDialogProps) {
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;

        const formData = new FormData(e.currentTarget);
        formData.set("is_super_admin", formData.get("is_super_admin") ? "true" : "false");

        startTransition(async () => {
            const result = await updateUserAction(user.id, formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Utilisateur modifié");
                onOpenChange(false);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
                    <DialogDescription>
                        Modifiez les informations de l&apos;utilisateur.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Nom complet
                        </label>
                        <input
                            name="full_name"
                            type="text"
                            defaultValue={user?.full_name || ""}
                            required
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Rôle
                        </label>
                        <select
                            name="role"
                            defaultValue={user?.role || "staff"}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        >
                            <option value="admin">Admin</option>
                            <option value="staff">Staff</option>
                            <option value="driver">Driver</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Organisation
                        </label>
                        <select
                            name="organization_id"
                            defaultValue={user?.organization_id || ""}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                        >
                            <option value="">Aucune</option>
                            {organizations.map(org => (
                                <option key={org.id} value={org.id}>
                                    {org.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="is_super_admin"
                            id="is_super_admin"
                            defaultChecked={user?.is_super_admin || false}
                            className="h-4 w-4 rounded border-border text-orange-500 focus:ring-orange-500/30"
                        />
                        <label htmlFor="is_super_admin" className="text-sm font-medium text-foreground">
                            Super Admin
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                        >
                            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Enregistrer
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
