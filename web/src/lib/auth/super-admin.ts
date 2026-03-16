import { getCurrentProfile } from "@/lib/auth/current-profile";

export async function requireSuperAdminAction() {
    const { userId, profile } = await getCurrentProfile();
    if (!userId) throw new Error("Non authentifié");
    if (!profile?.is_super_admin) throw new Error("Accès refusé");
    return { userId, profile };
}

export async function getSuperAdminUserIdOrNull() {
    const { userId, profile } = await getCurrentProfile();
    if (!userId) return null;
    if (!profile?.is_super_admin) return null;
    return userId;
}
