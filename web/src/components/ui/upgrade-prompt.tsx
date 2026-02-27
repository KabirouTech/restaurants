'use client'

import { useRef, useState } from 'react'
import { Zap, Smartphone, Building2, ArrowRight, Upload, ImageIcon, CheckCircle2, Loader2, X } from 'lucide-react'
import Image from 'next/image'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import {
  createUpgradeRequest,
  PLAN_PRICES,
  MOBILE_MONEY_NUMBERS,
  MOBILE_MONEY_QR_CODES,
  type PaymentMethod,
} from '@/lib/plans/upgrade-pipeline'
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
// UpgradeDialog — 3 étapes : paiement → preuve → confirmation
// ─────────────────────────────────────────────────────────────

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'wave',          label: 'Wave',             icon: <Smartphone className="h-4 w-4" />, color: 'border-blue-300 bg-blue-50 text-blue-800' },
  { key: 'orange_money',  label: 'Orange Money',     icon: <Smartphone className="h-4 w-4" />, color: 'border-orange-300 bg-orange-50 text-orange-800' },
  { key: 'bank_transfer', label: 'Virement bancaire', icon: <Building2 className="h-4 w-4" />, color: 'border-slate-300 bg-slate-50 text-slate-800' },
]

type Step = 'form' | 'proof' | 'done'

interface UpgradeDialogProps {
  orgId: string
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function UpgradeDialog({ orgId, open, onOpenChange }: UpgradeDialogProps) {
  const [step, setStep] = useState<Step>('form')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [requestId, setRequestId] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Étape 1 : soumettre la demande ──
  async function handleSubmitForm() {
    if (!selectedMethod) return
    setSubmitting(true)
    setFormError(null)

    const result = await createUpgradeRequest({
      orgId,
      targetPlan: 'premium',
      paymentMethod: selectedMethod,
      paymentReference: reference || undefined,
      amountFcfa: PLAN_PRICES.premium.fcfa,
      notes: notes || undefined,
    })

    setSubmitting(false)
    if (result.success && result.requestId) {
      setRequestId(result.requestId)
      setStep('proof')
    } else {
      setFormError(result.error || 'Erreur inconnue.')
    }
  }

  // ── Étape 2 : choisir la photo ──
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setProofFile(file)
    setProofPreview(URL.createObjectURL(file))
    setUploadError(null)
  }

  // ── Étape 2 : uploader la preuve ──
  async function handleUploadProof() {
    if (!proofFile || !requestId) return
    setUploading(true)
    setUploadError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const ext = proofFile.name.split('.').pop() || 'jpg'
    const path = `${user.id}/${requestId}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('payment-proofs')
      .upload(path, proofFile, { upsert: true })

    if (uploadErr) {
      setUploadError('Erreur lors de l\'envoi de l\'image. Réessayez.')
      setUploading(false)
      return
    }

    // Récupérer l'URL signée (valable 10 ans) pour l'admin
    const { data: urlData } = await supabase.storage
      .from('payment-proofs')
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10)

    const proofUrl = urlData?.signedUrl ?? null

    // Mettre à jour upgrade_request avec l'URL
    if (proofUrl) {
      await supabase
        .from('upgrade_requests')
        .update({ payment_proof_url: proofUrl })
        .eq('id', requestId)
    }

    setUploading(false)
    setStep('done')
  }

  function handleSkipProof() {
    setStep('done')
  }

  function handleClose() {
    onOpenChange(false)
    setTimeout(() => {
      setStep('form')
      setSelectedMethod(null)
      setReference('')
      setNotes('')
      setRequestId(null)
      setFormError(null)
      setProofFile(null)
      setProofPreview(null)
      setUploadError(null)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">

        {/* ── ÉTAPE 1 : Formulaire de paiement ── */}
        {step === 'form' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Passer au plan Premium
              </DialogTitle>
              <DialogDescription>
                <span className="font-semibold text-foreground">15 000 FCFA / mois</span> — commandes illimitées, 10 membres, messagerie unifiée et plus.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Méthode */}
              <div className="space-y-2">
                <Label>Méthode de paiement</Label>
                <div className="grid grid-cols-1 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setSelectedMethod(m.key)}
                      className={cn(
                        'flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition-all text-left w-full',
                        selectedMethod === m.key
                          ? m.color + ' ring-2 ring-offset-1 ring-current'
                          : 'border-border bg-card hover:bg-muted/50'
                      )}
                    >
                      <span className="flex items-center gap-2">{m.icon}{m.label}</span>
                      {MOBILE_MONEY_NUMBERS[m.key] && (
                        <span className="text-xs font-mono opacity-70">{MOBILE_MONEY_NUMBERS[m.key]}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions + QR code */}
              {selectedMethod && MOBILE_MONEY_NUMBERS[selectedMethod] && (
                <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-3 space-y-2.5">
                  <p className="text-xs font-semibold text-orange-800">Comment payer :</p>
                  <p className="text-xs text-orange-700">
                    Envoyez <strong>15 000 FCFA</strong> au{' '}
                    <span className="font-mono font-bold text-orange-900">{MOBILE_MONEY_NUMBERS[selectedMethod]}</span>{' '}
                    via {PAYMENT_METHODS.find(m => m.key === selectedMethod)?.label}.
                  </p>
                  {MOBILE_MONEY_QR_CODES[selectedMethod] && (
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <p className="text-xs text-orange-700 font-medium">Ou scannez le QR code :</p>
                      <div className="relative w-36 h-36 rounded-lg overflow-hidden border border-orange-300 bg-white shadow-sm">
                        <Image
                          src={MOBILE_MONEY_QR_CODES[selectedMethod]!}
                          alt="QR Code Orange Money"
                          fill
                          className="object-contain p-1"
                          unoptimized
                        />
                      </div>
                      <p className="text-xs text-orange-600">MAHAMADOU KABA</p>
                    </div>
                  )}
                </div>
              )}

              {/* Référence */}
              <div className="space-y-1.5">
                <Label htmlFor="ref">Référence de transaction (optionnel)</Label>
                <Input
                  id="ref"
                  placeholder="ex: TXN-123456"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes">Message (optionnel)</Label>
                <Textarea
                  id="notes"
                  placeholder="Question, besoin particulier..."
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
                disabled={!selectedMethod || submitting}
                onClick={handleSubmitForm}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {submitting ? 'Envoi...' : 'Continuer'}
                {!submitting && <ArrowRight className="h-4 w-4 ml-1.5" />}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── ÉTAPE 2 : Preuve de paiement ── */}
        {step === 'proof' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-500" />
                Joindre une preuve de paiement
              </DialogTitle>
              <DialogDescription>
                Envoyez une capture d'écran ou photo de votre transaction pour que nous puissions vérifier et activer votre plan rapidement.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Zone de drop / bouton */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'w-full rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 py-8 text-sm font-medium',
                  proofPreview
                    ? 'border-green-300 bg-green-50 text-green-700'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30 text-muted-foreground'
                )}
              >
                {proofPreview ? (
                  <>
                    <div className="relative w-full max-w-[220px] aspect-[3/4] rounded-lg overflow-hidden border border-green-300 shadow-sm">
                      <Image src={proofPreview} alt="Preuve" fill className="object-contain bg-white" unoptimized />
                    </div>
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Image sélectionnée · cliquez pour changer
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 opacity-40" />
                    <span>Appuyez pour choisir une photo</span>
                    <span className="text-xs opacity-60">JPG, PNG, HEIC · max 5 Mo</span>
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />

              {uploadError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{uploadError}</p>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="ghost"
                onClick={handleSkipProof}
                className="text-muted-foreground text-sm"
                disabled={uploading}
              >
                Passer cette étape
              </Button>
              <Button
                disabled={!proofFile || uploading}
                onClick={handleUploadProof}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {uploading ? 'Envoi en cours...' : 'Envoyer la preuve'}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── ÉTAPE 3 : Succès ── */}
        {step === 'done' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                Demande envoyée !
              </DialogTitle>
              <DialogDescription>
                Notre équipe traitera votre demande sous <strong>24h</strong> et vous contactera pour confirmer l'activation de votre plan Premium.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800 space-y-1">
                <p>✅ Demande créée avec succès</p>
                {requestId && <p className="text-xs text-green-600 font-mono">Réf. : {requestId.slice(0, 8).toUpperCase()}</p>}
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
