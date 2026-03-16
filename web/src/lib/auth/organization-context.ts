import { getCurrentProfile } from "@/lib/auth/current-profile";

export type OrganizationContext = {
  userId: string;
  profileId: string;
  organizationId: string;
};

export type OrganizationContextResult =
  | { ok: true; context: OrganizationContext }
  | { ok: false; error: string };

/**
 * Centralized auth+organization resolution for dashboard server actions.
 * Keeps behavior consistent and avoids fragile profile `.single()` lookups.
 */
export async function getRequiredOrganizationContext(
  notFoundMessage = "Organisation introuvable",
  notAuthenticatedMessage = "Non authentifié"
): Promise<OrganizationContextResult> {
  const { userId, profile } = await getCurrentProfile();

  if (!userId) {
    return { ok: false, error: notAuthenticatedMessage };
  }

  if (!profile?.organization_id) {
    return { ok: false, error: notFoundMessage };
  }

  return {
    ok: true,
    context: {
      userId,
      profileId: profile.id,
      organizationId: profile.organization_id,
    },
  };
}
