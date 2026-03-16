'use server'

import { createClient } from '@/utils/supabase/server'

/**
 * Accepte une invitation via son token.
 * Utilise la service role key pour contourner RLS.
 * Le userId provient de Clerk (passé depuis le client).
 */
export async function acceptInvitationAction(
  token: string,
  userId: string
): Promise<{
  success: boolean
  role?: string
  organizationId?: string
  error?: string
  upgradeRequired?: boolean
}> {
  if (!token || !userId) {
    return { success: false, error: 'Token ou utilisateur manquant.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.rpc('accept_invitation', {
    p_token: token,
    p_user_id: userId,
  })

  if (error) {
    console.error('[acceptInvitationAction] RPC error:', error)
    return { success: false, error: "Erreur lors de l'acceptation de l'invitation." }
  }

  if (!data?.success) {
    const upgradeRequired = data?.upgrade_required === true
    const errorMessages: Record<string, string> = {
      invitation_not_found_or_expired: 'Cette invitation est introuvable ou a expiré.',
      member_limit_reached:
        "L'organisation a atteint sa limite de membres. Demandez-leur de passer au plan supérieur.",
    }
    return {
      success: false,
      error: errorMessages[data?.reason] || 'Invitation invalide.',
      upgradeRequired,
    }
  }

  return {
    success: true,
    role: data.role,
    organizationId: data.organization_id,
  }
}
