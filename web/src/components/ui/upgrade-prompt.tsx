'use client'

import { useState } from 'react'
import { Zap, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { createUpgradeRequest } from '@/lib/plans/upgrade-pipeline'
import type { LimitCheckResult } from '@/lib/plans/plan-limits'

// ─────────────────────────────────────────────────────────────
// UpgradePrompt — bandeau inline affiché quand une limite est atteinte
// ─────────────────────────────────────────────────────────────

interface UpgradePromptProps {
  orgId: string
  limitInfo?: LimitCheckResult | null
  message?: string
  className?: string
  compact?: boolean
}

export function UpgradePrompt({ orgId, limitInfo, message, className, compact }: UpgradePromptProps) {
  const [open, setOpen] = useState(false)

  const defaultMsg = limitInfo
    ? `Limite atteinte : ${limitInfo.current}/${limitInfo.limit === -1 ? '∞' : limitInfo.limit}`
    : 'Limite de votre plan atteinte'

  if (compact) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 hover:bg-amber-100 transition-colors',
            className
          )}
        >
          <Zap className="h-3 w-3" />
          Passer au Premium
        </button>
        <UpgradeDialog orgId={orgId} open={open} onOpenChange={setOpen} />
      </>
    )
  }

  return (
    <>
      <div className={cn('flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3', className)}>
        <div className="flex items-center gap-2.5 min-w-0">
          <Zap className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm font-medium text-amber-800 truncate">{message || defaultMsg}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100"
          onClick={() => setOpen(true)}
        >
          Passer au Premium
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </div>
      <UpgradeDialog orgId={orgId} open={open} onOpenChange={setOpen} />
    </>
  )
}

// ─────────────────────────────────────────────────────────────
// UpgradeDialog — formulaire d'inscription au Premium
// ─────────────────────────────────────────────────────────────

type Step = 'form' | 'done'

interface UpgradeDialogProps {
  orgId: string
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function UpgradeDialog({ orgId, open, onOpenChange }: UpgradeDialogProps) {
  const [step, setStep] = useState<Step>('form')
  const [notes, setNotes] = useState('')
  const [requestId, setRequestId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit() {
    setSubmitting(true)
    setFormError(null)

    const result = await createUpgradeRequest({
      orgId,
      targetPlan: 'premium',
      notes: notes || undefined,
    })

    setSubmitting(false)
    if (result.success && result.requestId) {
      setRequestId(result.requestId)
      setStep('done')
    } else {
      setFormError(result.error || 'Erreur inconnue.')
    }
  }

  function handleClose() {
    onOpenChange(false)
    setTimeout(() => {
      setStep('form')
      setNotes('')
      setRequestId(null)
      setFormError(null)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">

        {step === 'form' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Passer au plan Premium
              </DialogTitle>
              <DialogDescription>
                Commandes illimitées, 10 membres, messagerie unifiée et plus. Notre équipe vous contactera pour finaliser votre inscription.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Plan highlights */}
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-2">
                <p className="text-sm font-semibold text-amber-900">Ce que vous débloquez :</p>
                <ul className="text-sm text-amber-800 space-y-1.5">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" /> Commandes illimitées</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" /> Messagerie unifiée (WhatsApp, Instagram, Email)</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" /> Jusqu&apos;à 10 membres dans l&apos;équipe</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" /> Calendrier & capacité avancés</li>
                </ul>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes">Message (optionnel)</Label>
                <Textarea
                  id="notes"
                  placeholder="Question, besoin particulier, nombre de membres..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Annuler</Button>
              <Button
                disabled={submitting}
                onClick={handleSubmit}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {submitting ? 'Envoi...' : "S'inscrire au Premium"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'done' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                Demande envoyée !
              </DialogTitle>
              <DialogDescription>
                Notre équipe vous contactera sous <strong>24h</strong> par WhatsApp ou email pour finaliser votre passage au Premium.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800 space-y-1">
                <p>Demande enregistrée avec succès</p>
                {requestId && <p className="text-xs text-green-600 font-mono">Ref. : {requestId.slice(0, 8).toUpperCase()}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700 text-white">Fermer</Button>
            </DialogFooter>
          </>
        )}

      </DialogContent>
    </Dialog>
  )
}
