/**
 * RestaurantsOS — Gestion des Membres d'Organisation
 *
 * Fonctions pour :
 * - Inviter un nouveau membre (email + rôle)
 * - Accepter une invitation (via token)
 * - Lister les membres d'une organisation
 * - Changer le rôle d'un membre
 * - Suspendre / retirer un membre
 * - Annuler une invitation en cours
 */

import { createClient } from '@/utils/supabase/client'
import { checkPlanLimit } from '@/lib/plans/plan-limits'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type MemberRole = 'superadmin' | 'admin' | 'member'
export type MemberStatus = 'active' | 'suspended' | 'pending'
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

export interface Member {
  id: string
  organization_id: string
  full_name: string | null
  role: MemberRole
  status: MemberStatus
  avatar_url: string | null
  phone: string | null
  last_active_at: string | null
  invited_by: string | null
  created_at: string
  // Jointure auth.users (email)
  email?: string
}

export interface Invitation {
  id: string
  organization_id: string
  invited_by: string
  email: string
  role: MemberRole
  status: InvitationStatus
  expires_at: string
  created_at: string
  token: string
}

// ─────────────────────────────────────────────────────────────
// INVITATIONS
// ─────────────────────────────────────────────────────────────

/**
 * Crée une invitation pour un nouveau membre.
 * Vérifie la limite du plan avant de créer.
 *
 * @example
 * const result = await inviteMember(orgId, 'jean@example.com', 'member')
 */
export async function inviteMember(
  orgId: string,
  email: string,
  role: MemberRole,
  userId: string
): Promise<{ success: boolean; invitation?: Invitation; error?: string; upgradeRequired?: boolean }> {
  if (!userId) return { success: false, error: 'Non authentifié' }

  const supabase = createClient()

  // 1. Vérifier la limite de membres du plan
  const limitCheck = await checkPlanLimit(orgId, 'members')
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: `Limite de membres atteinte (${limitCheck.current}/${limitCheck.limit}). Passez au plan supérieur pour ajouter plus de membres.`,
      upgradeRequired: true,
    }
  }

  // 2. Vérifier que l'email n'est pas déjà membre
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('organization_id', orgId)
    .eq('status', 'active')

  // 3. Créer l'invitation (token généré automatiquement par Postgres)
  const { data, error } = await supabase
    .from('organization_invitations')
    .upsert(
      {
        organization_id: orgId,
        invited_by: userId,
        email: email.toLowerCase().trim(),
        role,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        onConflict: 'organization_id,email',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Une invitation est déjà en cours pour cet email.' }
    }
    console.error('[inviteMember] error:', error)
    return { success: false, error: 'Erreur lors de la création de l\'invitation.' }
  }

  // 4. Envoyer l'email d'invitation (via Edge Function ou Resend)
  await sendInvitationEmail(email, data.token, orgId, role)

  return { success: true, invitation: data as Invitation }
}

/**
 * Envoie l'email d'invitation via une Edge Function.
 * La fonction construit le lien : /invite?token=XYZ
 */
async function sendInvitationEmail(
  email: string,
  token: string,
  orgId: string,
  role: MemberRole
): Promise<void> {
  const supabase = createClient()

  try {
    await supabase.functions.invoke('send-invitation-email', {
      body: { email, token, orgId, role },
    })
  } catch (err) {
    // L'invitation est créée même si l'email échoue.
    // L'admin peut partager le lien manuellement.
    console.warn('[sendInvitationEmail] Edge function error (non-blocking):', err)
  }
}

/**
 * Accepte une invitation via son token.
 * Appelle la fonction PostgreSQL `accept_invitation`.
 */
export async function acceptInvitation(
  token: string,
  userId: string
): Promise<{ success: boolean; organizationId?: string; role?: MemberRole; error?: string; upgradeRequired?: boolean }> {
  if (!userId) return { success: false, error: 'Vous devez être connecté pour accepter une invitation.' }

  const supabase = createClient()

  const { data, error } = await supabase.rpc('accept_invitation', {
    p_token: token,
    p_user_id: userId,
  })

  if (error) {
    console.error('[acceptInvitation] RPC error:', error)
    return { success: false, error: 'Erreur lors de l\'acceptation de l\'invitation.' }
  }

  if (!data.success) {
    const upgradeRequired = data.upgrade_required === true
    const errorMessages: Record<string, string> = {
      invitation_not_found_or_expired: 'Cette invitation est introuvable ou a expiré.',
      member_limit_reached: 'L\'organisation a atteint sa limite de membres. Demandez-leur de passer au plan supérieur.',
    }
    return {
      success: false,
      error: errorMessages[data.reason] || 'Invitation invalide.',
      upgradeRequired,
    }
  }

  return {
    success: true,
    organizationId: data.organization_id,
    role: data.role as MemberRole,
  }
}

/**
 * Annule une invitation en cours.
 */
export async function cancelInvitation(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('organization_invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)
    .eq('status', 'pending')

  if (error) {
    return { success: false, error: 'Impossible d\'annuler l\'invitation.' }
  }

  return { success: true }
}

/**
 * Renvoie l'email d'invitation (re-génère un nouveau token).
 */
export async function resendInvitation(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  // Prolonger l'expiration de 7 jours
  const { data, error } = await supabase
    .from('organization_invitations')
    .update({
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    })
    .eq('id', invitationId)
    .select('email, token, organization_id, role')
    .single()

  if (error || !data) {
    return { success: false, error: 'Impossible de renvoyer l\'invitation.' }
  }

  await sendInvitationEmail(data.email, data.token, data.organization_id, data.role)

  return { success: true }
}

// ─────────────────────────────────────────────────────────────
// GESTION DES MEMBRES
// ─────────────────────────────────────────────────────────────

/**
 * Liste tous les membres actifs et en attente d'une organisation.
 */
export async function listMembers(orgId: string): Promise<Member[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', orgId)
    .in('status', ['active', 'suspended', 'pending'])
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[listMembers] error:', error)
    return []
  }

  return data as Member[]
}

/**
 * Liste les invitations en cours d'une organisation.
 */
export async function listInvitations(orgId: string): Promise<Invitation[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('organization_invitations')
    .select('*')
    .eq('organization_id', orgId)
    .in('status', ['pending'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[listInvitations] error:', error)
    return []
  }

  return data as Invitation[]
}

/**
 * Change le rôle d'un membre.
 * Seul un admin peut changer les rôles.
 */
export async function changeMemberRole(
  profileId: string,
  newRole: MemberRole
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', profileId)

  if (error) {
    return { success: false, error: 'Impossible de changer le rôle.' }
  }

  return { success: true }
}

/**
 * Suspend un membre (il ne peut plus se connecter).
 * Son profil est conservé pour l'historique.
 */
export async function suspendMember(
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ status: 'suspended' })
    .eq('id', profileId)

  if (error) {
    return { success: false, error: 'Impossible de suspendre ce membre.' }
  }

  return { success: true }
}

/**
 * Réactive un membre suspendu.
 */
export async function reactivateMember(
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  // Vérifier la limite avant de réactiver
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', profileId)
    .single()

  if (profile) {
    const limitCheck = await checkPlanLimit(profile.organization_id, 'members')
    if (!limitCheck.allowed) {
      return {
        success: false,
        error: `Limite de membres atteinte. Passez au plan supérieur pour réactiver ce membre.`,
      }
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ status: 'active' })
    .eq('id', profileId)

  if (error) {
    return { success: false, error: 'Impossible de réactiver ce membre.' }
  }

  return { success: true }
}

/**
 * Retire définitivement un membre de l'organisation.
 * Son compte auth.users reste intact, mais il perd l'accès.
 */
export async function removeMember(
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('profiles')
    .update({
      organization_id: null,
      role: null,
      status: 'pending',
    })
    .eq('id', profileId)

  if (error) {
    return { success: false, error: 'Impossible de retirer ce membre.' }
  }

  return { success: true }
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<MemberRole, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrateur',
  member: 'Membre',
}

export const ROLE_COLORS: Record<MemberRole, string> = {
  superadmin: 'bg-purple-100 text-purple-800',
  admin: 'bg-amber-100 text-amber-800',
  member: 'bg-blue-100 text-blue-800',
}

export const STATUS_LABELS: Record<MemberStatus, string> = {
  active: 'Actif',
  suspended: 'Suspendu',
  pending: 'En attente',
}

export const ROLE_PERMISSIONS: Record<MemberRole, string[]> = {
  superadmin: [
    'Accès complet à la plateforme',
    'Gestion de toutes les organisations',
    'Configuration système',
  ],
  admin: [
    'Gérer les membres et invitations',
    'Changer le plan d\'abonnement',
    'Accès à tous les modules',
    'Paramètres de l\'organisation',
    'Rapports & statistiques',
  ],
  member: [
    'Gestion des commandes',
    'Accès à la messagerie',
    'Gestion des clients (CRM)',
    'Calendrier & capacité',
    'Catalogue menu',
  ],
}
