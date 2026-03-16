'use client'

import { useEffect, useState } from 'react'
import { Users, UserPlus, Mail, MoreHorizontal, Shield, Loader2, RefreshCw, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  ROLE_LABELS,
  ROLE_COLORS,
  STATUS_LABELS,
  type Member,
  type Invitation,
  type MemberRole,
} from '@/lib/members/member-management'
import {
  inviteMemberAction,
  listMembersAction,
  listInvitationsAction,
  cancelInvitationAction,
  resendInvitationAction,
  changeMemberRoleAction,
  suspendMemberAction,
  reactivateMemberAction,
  removeMemberAction,
} from '@/actions/members'
import { UpgradePrompt } from '@/components/ui/upgrade-prompt'

interface MembersSettingsProps {
  orgId: string
  currentUserProfileId: string
}

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'member', label: 'Membre' },
]

function initials(name: string | null, email?: string): string {
  if (name) return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  if (email) return email.slice(0, 2).toUpperCase()
  return '?'
}

export function MembersSettings({ orgId, currentUserProfileId }: MembersSettingsProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Invite form state
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('member')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [upgradeRequired, setUpgradeRequired] = useState(false)

  async function refresh() {
    setLoading(true)
    const [m, i] = await Promise.all([listMembersAction(), listInvitationsAction()])
    setMembers(m as Member[])
    setInvitations(i as Invitation[])
    setLoading(false)
  }

  useEffect(() => { refresh() }, [orgId])

  async function handleInvite() {
    if (!email.trim()) return
    setInviting(true)
    setInviteError(null)
    setUpgradeRequired(false)

    const result = await inviteMemberAction(email.trim(), role)
    setInviting(false)

    if (result.success) {
      setInviteOpen(false)
      setEmail('')
      setRole('member')
      refresh()
    } else {
      setInviteError(result.error || 'Erreur inconnue.')
      if (result.upgradeRequired) setUpgradeRequired(true)
    }
  }

  async function handleAction(action: () => Promise<{ success: boolean; error?: string }>, id: string) {
    setActionLoading(id)
    const res = await action()
    setActionLoading(null)
    if (!res.success) alert(res.error || 'Erreur')
    else refresh()
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Membres de l'équipe
              </CardTitle>
              <CardDescription>
                Gérez les accès de votre équipe. Les admins peuvent tout modifier.
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Inviter
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map((i) => <div key={i} className="h-14 bg-muted rounded-lg" />)}
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Aucun membre pour l'instant.</p>
          ) : (
            members.map((member) => {
              const isMe = member.id === currentUserProfileId
              const statusColor = member.status === 'active'
                ? 'bg-green-100 text-green-700'
                : member.status === 'suspended'
                ? 'bg-red-100 text-red-700'
                : 'bg-slate-100 text-slate-600'

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-muted/30 transition-colors"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {initials(member.full_name, member.email)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.full_name || member.email || 'Sans nom'}
                      {isMe && <span className="text-xs text-muted-foreground ml-1.5">(vous)</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className={cn('text-xs py-0 px-1.5', ROLE_COLORS[member.role as MemberRole] || '')}>
                        {ROLE_LABELS[member.role as MemberRole] || member.role}
                      </Badge>
                      <span className={cn('text-xs rounded-full px-1.5 py-0', statusColor)}>
                        {STATUS_LABELS[member.status as keyof typeof STATUS_LABELS] || member.status}
                      </span>
                    </div>
                  </div>

                  {!isMe && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" disabled={actionLoading === member.id}>
                          {actionLoading === member.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <MoreHorizontal className="h-3.5 w-3.5" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {ROLE_OPTIONS.filter((r) => r.value !== member.role).map((r) => (
                          <DropdownMenuItem key={r.value} onClick={() => handleAction(() => changeMemberRoleAction(member.id, r.value), member.id)}>
                            <Shield className="h-3.5 w-3.5 mr-2" />
                            Rôle : {r.label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        {member.status === 'active' ? (
                          <DropdownMenuItem
                            className="text-amber-600"
                            onClick={() => handleAction(() => suspendMemberAction(member.id), member.id)}
                          >
                            Suspendre
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-green-600"
                            onClick={() => handleAction(() => reactivateMemberAction(member.id), member.id)}
                          >
                            Réactiver
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleAction(() => removeMemberAction(member.id), member.id)}
                        >
                          Retirer de l'organisation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* ── Invitations en cours ── */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Invitations en attente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 rounded-lg border border-dashed border-border px-3 py-2.5">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABELS[inv.role]} · expire le {new Date(inv.expires_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={actionLoading === inv.id}
                    onClick={() => handleAction(() => resendInvitationAction(inv.id), inv.id)}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Renvoyer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-red-600 hover:text-red-700"
                    disabled={actionLoading === inv.id}
                    onClick={() => handleAction(() => cancelInvitationAction(inv.id), inv.id)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Dialog Invitation ── */}
      <Dialog open={inviteOpen} onOpenChange={(v) => { setInviteOpen(v); if (!v) { setInviteError(null); setUpgradeRequired(false) } }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          {/* ── Bannière décorative ── */}
          <div className="relative h-40 overflow-hidden bg-gradient-to-br from-orange-500 via-amber-500 to-orange-700">
            {/* Motif de points */}
            <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="3" cy="3" r="2" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots)" />
            </svg>
            {/* Cercles décoratifs flottants */}
            <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full bg-white/10 blur-sm" />
            <div className="absolute -bottom-10 -left-8 w-48 h-48 rounded-full bg-white/10 blur-sm" />
            <div className="absolute top-4 right-16 w-16 h-16 rounded-full bg-orange-300/30" />
            {/* Icônes flottantes */}
            <div className="absolute top-5 right-8 p-3 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg rotate-6">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div className="absolute bottom-6 right-24 p-2.5 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg -rotate-3">
              <Users className="h-5 w-5 text-white" />
            </div>
            {/* Texte principal */}
            <div className="absolute inset-0 flex flex-col justify-center px-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-white/25 backdrop-blur-sm border border-white/30">
                  <UserPlus className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white drop-shadow">Inviter un membre</h2>
              </div>
              <p className="text-sm text-orange-100 max-w-xs leading-relaxed">
                Un lien d'invitation sécurisé sera envoyé par email, valable <strong className="text-white">7 jours</strong>.
              </p>
            </div>
          </div>

          {/* ── Corps du formulaire ── */}
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="inv-email" className="text-sm font-medium">
                Adresse email
              </Label>
              <Input
                id="inv-email"
                type="email"
                placeholder="jean@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Rôle</Label>
              <Select value={role} onValueChange={(v) => setRole(v as MemberRole)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Les administrateurs peuvent modifier les paramètres et inviter d'autres membres.
              </p>
            </div>

            {inviteError && !upgradeRequired && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 flex items-start gap-2">
                <span className="mt-0.5 shrink-0">⚠️</span>
                {inviteError}
              </p>
            )}

            {upgradeRequired && (
              <UpgradePrompt
                orgId={orgId}
                message={inviteError || 'Limite de membres atteinte'}
              />
            )}

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setInviteOpen(false)}>
                Annuler
              </Button>
              <Button className="flex-1" disabled={!email.trim() || inviting} onClick={handleInvite}>
                {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Envoyer l'invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
