/**
 * RestaurantsOS — Upgrade Pipeline
 *
 * Gère le processus d'upgrade de plan :
 * 1. L'utilisateur soumet une demande d'upgrade (upgrade_requests)
 * 2. Un admin RestaurantsOS valide + appelle upgrade_organization_plan()
 * 3. L'organisation passe au nouveau plan
 *
 * Méthodes de paiement supportées : Wave, Orange Money, CinetPay, virement bancaire
 */

import { createClient } from '@/utils/supabase/client'
import type { PlanKey } from './plan-limits'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type PaymentMethod = 'wave' | 'orange_money' | 'cinetpay' | 'bank_transfer' | 'other'

export type UpgradeRequestStatus = 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled'

export interface UpgradeRequest {
  id: string
  organization_id: string
  requested_by: string
  target_plan: PlanKey
  status: UpgradeRequestStatus
  payment_method: PaymentMethod | null
  payment_reference: string | null
  amount_fcfa: number | null
  notes: string | null
  admin_notes: string | null
  created_at: string
  processed_at: string | null
}

export interface CreateUpgradeRequestInput {
  orgId: string
  targetPlan: PlanKey
  paymentMethod: PaymentMethod
  paymentReference?: string
  amountFcfa?: number
  notes?: string
}

export interface SubscriptionInfo {
  id: string
  organization_id: string
  plan_key: PlanKey
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'paused'
  billing_cycle: 'monthly' | 'annual' | 'lifetime'
  current_period_start: string
  current_period_end: string | null
  payment_provider: string | null
  created_at: string
  updated_at: string
}

// ─────────────────────────────────────────────────────────────
// Créer une demande d'upgrade (côté client)
// ─────────────────────────────────────────────────────────────

/**
 * Soumet une demande d'upgrade. Un admin RestaurantsOS la traitera.
 * Une notification sera envoyée par email/WhatsApp une fois validée.
 */
export async function createUpgradeRequest(
  input: CreateUpgradeRequestInput
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  const supabase = createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return { success: false, error: 'Non authentifié' }

  // Récupérer le plan actuel pour vérifier que c'est bien un upgrade
  const { data: org } = await supabase
    .from('organizations')
    .select('subscription_plan')
    .eq('id', input.orgId)
    .single()

  if (org?.subscription_plan === input.targetPlan) {
    return { success: false, error: 'Vous êtes déjà sur ce plan.' }
  }

  // Vérifier qu'il n'y a pas déjà une demande en cours
  const { data: existing } = await supabase
    .from('upgrade_requests')
    .select('id, status')
    .eq('organization_id', input.orgId)
    .in('status', ['pending', 'processing'])
    .single()

  if (existing) {
    return {
      success: false,
      error: 'Une demande d\'upgrade est déjà en cours. Notre équipe la traitera sous 24h.',
    }
  }

  // Créer la demande
  const { data, error } = await supabase
    .from('upgrade_requests')
    .insert({
      organization_id: input.orgId,
      requested_by: user.user.id,
      target_plan: input.targetPlan,
      payment_method: input.paymentMethod,
      payment_reference: input.paymentReference ?? null,
      amount_fcfa: input.amountFcfa ?? null,
      notes: input.notes ?? null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createUpgradeRequest] error:', error)
    return { success: false, error: 'Erreur lors de la création de la demande.' }
  }

  return { success: true, requestId: data.id }
}

// ─────────────────────────────────────────────────────────────
// Approuver et activer un upgrade (côté admin RestaurantsOS)
// ─────────────────────────────────────────────────────────────

/**
 * Réservé aux super-admins RestaurantsOS.
 * Active le plan via la fonction PostgreSQL `upgrade_organization_plan`.
 */
export async function approveUpgradeRequest(
  requestId: string,
  adminNotes?: string
): Promise<{ success: boolean; error?: string; result?: Record<string, unknown> }> {
  const supabase = createClient()

  const { data: user } = await supabase.auth.getUser()
  if (!user.user) return { success: false, error: 'Non authentifié' }

  // Récupérer la demande
  const { data: req, error: reqErr } = await supabase
    .from('upgrade_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (reqErr || !req) return { success: false, error: 'Demande introuvable.' }
  if (req.status !== 'pending' && req.status !== 'processing') {
    return { success: false, error: `La demande est déjà en statut: ${req.status}` }
  }

  // Appeler la fonction d'upgrade
  const { data: upgradeResult, error: upgradeErr } = await supabase.rpc(
    'upgrade_organization_plan',
    {
      p_org_id: req.organization_id,
      p_new_plan: req.target_plan,
      p_triggered_by: user.user.id,
      p_payment_reference: req.payment_reference,
      p_payment_provider: req.payment_method,
    }
  )

  if (upgradeErr || !upgradeResult?.success) {
    return {
      success: false,
      error: upgradeErr?.message || upgradeResult?.reason || 'Erreur lors de l\'upgrade.',
    }
  }

  // Marquer la demande comme complétée
  await supabase
    .from('upgrade_requests')
    .update({
      status: 'completed',
      processed_at: new Date().toISOString(),
      processed_by: user.user.id,
      admin_notes: adminNotes ?? null,
    })
    .eq('id', requestId)

  return { success: true, result: upgradeResult }
}

// ─────────────────────────────────────────────────────────────
// Récupérer l'abonnement actuel
// ─────────────────────────────────────────────────────────────

export async function getSubscriptionInfo(orgId: string): Promise<SubscriptionInfo | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('organization_id', orgId)
    .single()

  if (error) {
    console.error('[getSubscriptionInfo] error:', error)
    return null
  }

  return data as SubscriptionInfo
}

// ─────────────────────────────────────────────────────────────
// Récupérer l'historique des upgrades
// ─────────────────────────────────────────────────────────────

export async function getSubscriptionHistory(orgId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('subscription_events')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getSubscriptionHistory] error:', error)
    return []
  }

  return data
}

// ─────────────────────────────────────────────────────────────
// Annuler une demande d'upgrade (côté client)
// ─────────────────────────────────────────────────────────────

export async function cancelUpgradeRequest(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('upgrade_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId)
    .in('status', ['pending'])

  if (error) {
    return { success: false, error: 'Impossible d\'annuler la demande.' }
  }

  return { success: true }
}

// ─────────────────────────────────────────────────────────────
// Prix par plan (helper UI)
// ─────────────────────────────────────────────────────────────

export const PLAN_PRICES: Record<PlanKey, { fcfa: number; eur: number; label: string }> = {
  free: { fcfa: 0, eur: 0, label: 'Gratuit' },
  premium: { fcfa: 15000, eur: 23, label: '15 000 FCFA/mois' },
  enterprise: { fcfa: 0, eur: 0, label: 'Sur devis' },
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  wave: 'Wave',
  orange_money: 'Orange Money',
  cinetpay: 'CinetPay',
  bank_transfer: 'Virement bancaire',
  other: 'Autre',
}

/**
 * Numéros Mobile Money pour recevoir les paiements d'abonnement.
 * Mets à jour ces numéros avec tes vrais numéros Wave et Orange Money.
 */
export const MOBILE_MONEY_NUMBERS: Partial<Record<PaymentMethod, string>> = {
  wave: '77 525 91 69',
  orange_money: '77 413 02 89',
}

/**
 * QR codes Mobile Money (chemins depuis /public).
 */
export const MOBILE_MONEY_QR_CODES: Partial<Record<PaymentMethod, string>> = {
  orange_money: '/orange-money-qr-code.jpeg',
}
