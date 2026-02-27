/**
 * RestaurantsOS — usePlanLimit Hook
 *
 * Hook React pour vérifier les limites du plan en temps réel.
 * Utilisé dans toute l'app pour bloquer les actions dépassant les limites.
 *
 * @example
 * // Dans un composant
 * const { canCreate, limitInfo, isLoading } = usePlanLimit('orders')
 *
 * if (!canCreate) return <UpgradePrompt resource="orders" limitInfo={limitInfo} />
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useOrganization } from '@/hooks/useOrganization'
import {
  checkPlanFeature,
  checkPlanLimit,
  LimitCheckResult,
  PlanFeature,
  PlanResource,
} from '@/lib/plans/plan-limits'

// ─────────────────────────────────────────────────────────────
// usePlanLimit — vérification de limite de ressource
// ─────────────────────────────────────────────────────────────

interface UsePlanLimitReturn {
  canCreate: boolean
  limitInfo: LimitCheckResult | null
  isLoading: boolean
  refresh: () => void
}

export function usePlanLimit(resource: PlanResource): UsePlanLimitReturn {
  const { organization } = useOrganization()
  const [limitInfo, setLimitInfo] = useState<LimitCheckResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    if (!organization?.id) return
    setIsLoading(true)
    try {
      const result = await checkPlanLimit(organization.id, resource)
      setLimitInfo(result)
    } finally {
      setIsLoading(false)
    }
  }, [organization?.id, resource])

  useEffect(() => {
    load()
  }, [load])

  return {
    canCreate: limitInfo?.allowed ?? true,
    limitInfo,
    isLoading,
    refresh: load,
  }
}

// ─────────────────────────────────────────────────────────────
// usePlanFeature — vérification d'une fonctionnalité
// ─────────────────────────────────────────────────────────────

interface UsePlanFeatureReturn {
  hasFeature: boolean
  isLoading: boolean
}

export function usePlanFeature(feature: PlanFeature): UsePlanFeatureReturn {
  const { organization } = useOrganization()
  const [hasFeature, setHasFeature] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!organization?.id) return

    setIsLoading(true)
    checkPlanFeature(organization.id, feature)
      .then(setHasFeature)
      .finally(() => setIsLoading(false))
  }, [organization?.id, feature])

  return { hasFeature, isLoading }
}
