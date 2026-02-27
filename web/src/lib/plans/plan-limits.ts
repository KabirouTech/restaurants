/**
 * RestaurantsOS — Plan Limits & Enforcement
 *
 * Ce module est le point central pour toute vérification de limite de plan.
 * Utilise la fonction PostgreSQL `check_plan_limit` via RPC Supabase.
 */

import { createClient } from '@/utils/supabase/client'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type PlanKey = 'free' | 'premium' | 'enterprise'

export type PlanResource =
  | 'orders'
  | 'members'
  | 'products'
  | 'channels'
  | 'customers'
  | 'capacity_types'

export type PlanFeature =
  | 'has_unified_inbox'
  | 'has_realtime_tracking'
  | 'has_ai_replies'
  | 'has_api_access'
  | 'has_white_label'
  | 'has_advanced_reports'
  | 'has_custom_integrations'

export interface LimitCheckResult {
  allowed: boolean
  current: number
  limit: number
  remaining: number
  unlimited: boolean
  percentage: number
  plan: PlanKey
  resource: PlanResource
}

export interface PlanDefinition {
  plan_key: PlanKey
  name: string
  price_fcfa: number
  price_eur_cents: number
  max_members: number
  max_orders_per_month: number
  max_products: number
  max_customers: number
  max_channels: number
  max_capacity_types: number
  has_unified_inbox: boolean
  has_realtime_tracking: boolean
  has_ai_replies: boolean
  has_api_access: boolean
  has_white_label: boolean
  has_advanced_reports: boolean
  has_custom_integrations: boolean
  sort_order: number
}

export interface PlanUsage {
  organization_id: string
  plan_key: PlanKey
  member_count: number
  orders_this_month: number
  product_count: number
  customer_count: number
  channel_count: number
  capacity_type_count: number
}

// ─────────────────────────────────────────────────────────────
// Vérification d'une limite de ressource (via RPC)
// ─────────────────────────────────────────────────────────────

/**
 * Vérifie si l'organisation peut encore créer/utiliser une ressource.
 * Appelle la fonction PostgreSQL `check_plan_limit`.
 *
 * @example
 * const result = await checkPlanLimit(orgId, 'orders')
 * if (!result.allowed) showUpgradeModal()
 */
export async function checkPlanLimit(
  orgId: string,
  resource: PlanResource
): Promise<LimitCheckResult> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('check_plan_limit', {
    p_org_id: orgId,
    p_resource: resource,
  })

  if (error) {
    console.error('[checkPlanLimit] RPC error:', error)
    // En cas d'erreur, on autorise par défaut (fail open) pour ne pas bloquer l'UX
    return {
      allowed: true,
      current: 0,
      limit: -1,
      remaining: -1,
      unlimited: true,
      percentage: 0,
      plan: 'free',
      resource,
    }
  }

  return data as LimitCheckResult
}

// ─────────────────────────────────────────────────────────────
// Vérification d'une fonctionnalité (feature flag)
// ─────────────────────────────────────────────────────────────

/**
 * Vérifie si le plan de l'organisation inclut une fonctionnalité.
 *
 * @example
 * const hasInbox = await checkPlanFeature(orgId, 'has_unified_inbox')
 * if (!hasInbox) showUpgradePrompt('unified_inbox')
 */
export async function checkPlanFeature(
  orgId: string,
  feature: PlanFeature
): Promise<boolean> {
  const supabase = createClient()

  const { data: org, error } = await supabase
    .from('organizations')
    .select('subscription_plan')
    .eq('id', orgId)
    .single()

  if (error || !org) return false

  const planKey = org.subscription_plan || 'free'

  const { data: plan, error: planErr } = await supabase
    .from('plan_definitions')
    .select(feature)
    .eq('plan_key', planKey)
    .single()

  if (planErr || !plan) return false

  return (plan as any)[feature] === true
}

// ─────────────────────────────────────────────────────────────
// Récupérer tous les plans (pour la page de tarifs)
// ─────────────────────────────────────────────────────────────

export async function getAllPlans(): Promise<PlanDefinition[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('plan_definitions')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  if (error) {
    console.error('[getAllPlans] error:', error)
    return []
  }

  return data as PlanDefinition[]
}

// ─────────────────────────────────────────────────────────────
// Récupérer l'usage actuel d'une organisation
// ─────────────────────────────────────────────────────────────

export async function getOrgUsage(orgId: string): Promise<PlanUsage | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('plan_usage')
    .select('*')
    .eq('organization_id', orgId)
    .single()

  if (error) {
    console.error('[getOrgUsage] error:', error)
    return null
  }

  return data as PlanUsage
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/**
 * Formate une limite pour l'affichage.
 * -1 → "Illimité"
 */
export function formatLimit(limit: number): string {
  return limit === -1 ? 'Illimité' : limit.toString()
}

/**
 * Retourne la couleur CSS selon le pourcentage d'utilisation.
 */
export function getUsageColor(percentage: number): string {
  if (percentage >= 90) return 'text-red-600'
  if (percentage >= 75) return 'text-amber-500'
  return 'text-green-600'
}

/**
 * Retourne le label du prochain plan disponible.
 */
export function getNextPlanLabel(currentPlan: PlanKey): string | null {
  const order: PlanKey[] = ['free', 'premium', 'enterprise']
  const idx = order.indexOf(currentPlan)
  if (idx === -1 || idx === order.length - 1) return null
  return order[idx + 1]
}
