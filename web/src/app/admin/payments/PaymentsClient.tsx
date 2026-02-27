'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2, XCircle, Eye, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'

type Request = {
  id: string
  status: string
  payment_method: string | null
  payment_reference: string | null
  payment_proof_url: string | null
  amount_fcfa: number | null
  notes: string | null
  admin_notes: string | null
  created_at: string
  processed_at: string | null
  target_plan: string
  organizations: { id: string; name: string; slug: string } | null
  profiles: { full_name: string | null } | null
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:    { label: 'En attente',  color: 'bg-amber-100 text-amber-700' },
  processing: { label: 'En cours',    color: 'bg-blue-100 text-blue-700' },
  completed:  { label: 'Approuvé',    color: 'bg-green-100 text-green-700' },
  rejected:   { label: 'Rejeté',      color: 'bg-red-100 text-red-700' },
  cancelled:  { label: 'Annulé',      color: 'bg-slate-100 text-slate-600' },
}

const METHOD_LABELS: Record<string, string> = {
  wave: 'Wave',
  orange_money: 'Orange Money',
  cinetpay: 'CinetPay',
  bank_transfer: 'Virement',
  other: 'Autre',
}

export function PaymentsClient({ requests: initial }: { requests: Request[] }) {
  const [requests, setRequests] = useState(initial)
  const [filter, setFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Request | null>(null)
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [proofOpen, setProofOpen] = useState<string | null>(null)

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  async function handleAction() {
    if (!selected || !action) return
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    if (action === 'approve') {
      // Appeler la fonction RPC upgrade_organization_plan
      const { data: upgradeResult, error: upgradeErr } = await supabase.rpc(
        'upgrade_organization_plan',
        {
          p_org_id: selected.organizations?.id,
          p_new_plan: selected.target_plan,
          p_triggered_by: user.id,
          p_payment_reference: selected.payment_reference,
          p_payment_provider: selected.payment_method,
        }
      )

      if (upgradeErr || !upgradeResult?.success) {
        alert(upgradeErr?.message || upgradeResult?.reason || 'Erreur lors de l\'upgrade.')
        setLoading(false)
        return
      }

      await supabase
        .from('upgrade_requests')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq('id', selected.id)

    } else {
      await supabase
        .from('upgrade_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq('id', selected.id)
    }

    // Mettre à jour le state local
    setRequests(prev => prev.map(r =>
      r.id === selected.id
        ? { ...r, status: action === 'approve' ? 'completed' : 'rejected', admin_notes: adminNotes || null }
        : r
    ))
    setSelected(null)
    setAction(null)
    setAdminNotes('')
    setLoading(false)
  }

  return (
    <>
      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap">
        {['all', 'pending', 'processing', 'completed', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              filter === f
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-card border-border text-muted-foreground hover:bg-muted'
            )}
          >
            {f === 'all' ? 'Tous' : STATUS_META[f]?.label ?? f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organisation</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan demandé</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paiement</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Montant</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preuve</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">Aucune demande</td></tr>
              ) : filtered.map((req) => {
                const meta = STATUS_META[req.status] ?? STATUS_META.pending
                const isPending = req.status === 'pending' || req.status === 'processing'

                return (
                  <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/organizations/${req.organizations?.id}`} className="group">
                        <p className="font-medium group-hover:text-orange-500 transition-colors">{req.organizations?.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">/{req.organizations?.slug}</p>
                        {req.profiles?.full_name && (
                          <p className="text-xs text-muted-foreground">{req.profiles.full_name}</p>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                        {req.target_plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="font-medium">{METHOD_LABELS[req.payment_method ?? ''] ?? req.payment_method ?? '—'}</p>
                      {req.payment_reference && (
                        <p className="text-muted-foreground font-mono">{req.payment_reference}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">
                      {req.amount_fcfa ? `${req.amount_fcfa.toLocaleString('fr-FR')} FCFA` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {req.payment_proof_url ? (
                        <button
                          onClick={() => setProofOpen(req.payment_proof_url)}
                          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Voir
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Aucune</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', meta.color)}>
                        {meta.label}
                      </span>
                      {req.admin_notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-[120px] truncate">{req.admin_notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(req.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      {isPending && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white px-2"
                            onClick={() => { setSelected(req); setAction('approve') }}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50 px-2"
                            onClick={() => { setSelected(req); setAction('reject') }}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Rejeter
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog confirmation */}
      <Dialog open={!!selected} onOpenChange={(v) => { if (!v) { setSelected(null); setAction(null); setAdminNotes('') } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className={cn('flex items-center gap-2', action === 'approve' ? 'text-green-700' : 'text-red-700')}>
              {action === 'approve'
                ? <><CheckCircle2 className="h-5 w-5" /> Approuver l'upgrade</>
                : <><XCircle className="h-5 w-5" /> Rejeter la demande</>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {action === 'approve'
                ? `L'organisation "${selected?.organizations?.name}" passera immédiatement au plan ${selected?.target_plan}.`
                : `La demande de "${selected?.organizations?.name}" sera rejetée.`}
            </p>
            <div className="space-y-1.5">
              <Label>Note admin (optionnel)</Label>
              <Textarea
                placeholder="Raison, message pour le client..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelected(null); setAction(null) }}>Annuler</Button>
            <Button
              disabled={loading}
              onClick={handleAction}
              className={action === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : action === 'approve' ? 'Confirmer l\'upgrade' : 'Rejeter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog preuve de paiement */}
      <Dialog open={!!proofOpen} onOpenChange={(v) => { if (!v) setProofOpen(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Preuve de paiement</DialogTitle>
          </DialogHeader>
          {proofOpen && (
            <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden border border-border bg-muted">
              <Image
                src={proofOpen}
                alt="Preuve de paiement"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
