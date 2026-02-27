'use client'

import { useEffect, useState } from 'react'
import { Zap, CheckCircle2, Lock, Users, ShoppingBag, Package, UserCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getAllPlans, getOrgUsage, formatLimit, type PlanDefinition, type PlanUsage } from '@/lib/plans/plan-limits'
import { UpgradeDialog } from '@/components/ui/upgrade-prompt'

interface BillingSettingsProps {
  orgId: string
  currentPlan: string
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'Gratuit', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  premium: { label: 'Premium', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  enterprise: { label: 'Sur Mesure', color: 'bg-violet-100 text-violet-700 border-violet-200' },
}

const FEATURES: { key: keyof PlanDefinition; label: string }[] = [
  { key: 'has_unified_inbox', label: 'Messagerie unifiée (WhatsApp, Instagram, Email)' },
  { key: 'has_realtime_tracking', label: 'Suivi en temps réel des livraisons' },
  { key: 'has_ai_replies', label: 'Réponses assistées par IA' },
  { key: 'has_advanced_reports', label: 'Rapports & statistiques avancés' },
  { key: 'has_api_access', label: 'Accès API' },
  { key: 'has_white_label', label: 'White label (sans branding RestaurantsOS)' },
  { key: 'has_custom_integrations', label: 'Intégrations personnalisées' },
]

function UsageBar({ label, current, max, icon }: { label: string; current: number; max: number; icon: React.ReactNode }) {
  const unlimited = max === -1
  const pct = unlimited ? 0 : Math.min(100, Math.round((current / max) * 100))
  const color = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-green-500'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
          {icon}
          {label}
        </span>
        <span className={cn('font-semibold tabular-nums', pct >= 90 ? 'text-red-600' : pct >= 75 ? 'text-amber-600' : 'text-foreground')}>
          {current}
          <span className="text-muted-foreground font-normal"> / {unlimited ? '∞' : max}</span>
        </span>
      </div>
      {!unlimited && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}

export function BillingSettings({ orgId, currentPlan }: BillingSettingsProps) {
  const [plans, setPlans] = useState<PlanDefinition[]>([])
  const [usage, setUsage] = useState<PlanUsage | null>(null)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAllPlans(), getOrgUsage(orgId)]).then(([p, u]) => {
      setPlans(p)
      setUsage(u)
      setLoading(false)
    })
  }, [orgId])

  const activePlan = plans.find((p) => p.plan_key === currentPlan)
  const planMeta = PLAN_LABELS[currentPlan] ?? PLAN_LABELS.free

  return (
    <div className="space-y-6">
      {/* ── Plan actuel ── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Plan actuel
              </CardTitle>
              <CardDescription>Votre abonnement RestaurantsOS</CardDescription>
            </div>
            <Badge variant="outline" className={planMeta.color}>
              {planMeta.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-muted rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              <UsageBar
                label="Commandes ce mois"
                current={usage?.orders_this_month ?? 0}
                max={activePlan?.max_orders_per_month ?? 30}
                icon={<ShoppingBag className="h-3.5 w-3.5" />}
              />
              <UsageBar
                label="Membres"
                current={usage?.member_count ?? 0}
                max={activePlan?.max_members ?? 1}
                icon={<Users className="h-3.5 w-3.5" />}
              />
              <UsageBar
                label="Produits"
                current={usage?.product_count ?? 0}
                max={activePlan?.max_products ?? 10}
                icon={<Package className="h-3.5 w-3.5" />}
              />
              <UsageBar
                label="Clients"
                current={usage?.customer_count ?? 0}
                max={activePlan?.max_customers ?? 100}
                icon={<UserCheck className="h-3.5 w-3.5" />}
              />
            </>
          )}

          {currentPlan === 'free' && (
            <div className="pt-2">
              <Button
                onClick={() => setUpgradeOpen(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              >
                <Zap className="h-4 w-4 mr-2" />
                Passer au plan Premium — 15 000 FCFA/mois
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Comparatif des plans ── */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Comparer les plans</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {loading
            ? [1, 2, 3].map((i) => <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />)
            : plans.map((plan) => {
                const isActive = plan.plan_key === currentPlan
                const meta = PLAN_LABELS[plan.plan_key] ?? PLAN_LABELS.free
                const isPremium = plan.plan_key === 'premium'

                return (
                  <div
                    key={plan.plan_key}
                    className={cn(
                      'rounded-xl border p-4 space-y-4 transition-all',
                      isActive ? 'border-amber-300 bg-amber-50/50 ring-1 ring-amber-200' : 'border-border bg-card',
                      isPremium && !isActive && 'border-amber-200'
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{plan.name}</span>
                        {isActive && <Badge className="text-xs bg-amber-500 text-white border-0">Actif</Badge>}
                      </div>
                      <p className="text-xl font-bold">
                        {plan.price_fcfa === 0
                          ? plan.plan_key === 'enterprise'
                            ? 'Sur devis'
                            : 'Gratuit'
                          : `${plan.price_fcfa.toLocaleString('fr-FR')} FCFA`}
                        {plan.price_fcfa > 0 && <span className="text-sm font-normal text-muted-foreground">/mois</span>}
                      </p>
                    </div>

                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        {formatLimit(plan.max_orders_per_month)} commandes/mois
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        {formatLimit(plan.max_members)} membre{plan.max_members !== 1 ? 's' : ''}
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        {formatLimit(plan.max_products)} produits
                      </li>
                      {FEATURES.map((f) => {
                        const has = (plan as any)[f.key] === true
                        return (
                          <li key={f.key} className={cn('flex items-center gap-1.5', !has && 'opacity-40')}>
                            {has ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 shrink-0" />
                            )}
                            {f.label}
                          </li>
                        )
                      })}
                    </ul>

                    {!isActive && plan.plan_key === 'premium' && (
                      <Button
                        size="sm"
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={() => setUpgradeOpen(true)}
                      >
                        Choisir ce plan
                      </Button>
                    )}
                    {!isActive && plan.plan_key === 'enterprise' && (
                      <Button size="sm" variant="outline" className="w-full" asChild>
                        <a href="mailto:hello@restaurantsos.com">Nous contacter</a>
                      </Button>
                    )}
                  </div>
                )
              })}
        </div>
      </div>

      <UpgradeDialog orgId={orgId} open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  )
}
