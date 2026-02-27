'use client'

import { useState, useTransition } from 'react'
import { Utensils, ShieldCheck, Tag, MessageSquare, FileText, Save, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { updateMenuInfoAction } from '@/actions/settings'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { SettingsSavePortal } from './SettingsSavePortal'

// ─── Les 14 allergènes majeurs (directive UE) ───────────────────────────────

const ALLERGENS = [
  { key: 'gluten',      label: 'Gluten',           emoji: '🌾', desc: 'Blé, seigle, orge, avoine...' },
  { key: 'crustaces',   label: 'Crustacés',         emoji: '🦐', desc: 'Crevettes, homard, crabe...' },
  { key: 'oeufs',       label: 'Œufs',              emoji: '🥚', desc: 'Toutes formes' },
  { key: 'poissons',    label: 'Poissons',           emoji: '🐟', desc: 'Toutes espèces' },
  { key: 'arachides',   label: 'Arachides',          emoji: '🥜', desc: 'Cacahuètes et dérivés' },
  { key: 'soja',        label: 'Soja',               emoji: '🫘', desc: 'Graines et produits dérivés' },
  { key: 'lait',        label: 'Lait & Lactose',     emoji: '🥛', desc: 'Vache, chèvre, brebis...' },
  { key: 'fruits_coq',  label: 'Fruits à coque',     emoji: '🌰', desc: 'Amandes, noisettes, noix...' },
  { key: 'celeri',      label: 'Céleri',             emoji: '🥬', desc: 'Tiges, feuilles, graines' },
  { key: 'moutarde',    label: 'Moutarde',           emoji: '🌿', desc: 'Graines et feuilles' },
  { key: 'sesame',      label: 'Sésame',             emoji: '🌿', desc: 'Graines et huile' },
  { key: 'so2',         label: 'Sulfites (SO₂)',     emoji: '🍷', desc: 'Vins, conserves, fruits secs...' },
  { key: 'lupin',       label: 'Lupin',              emoji: '🌻', desc: 'Farines et flocons de lupin' },
  { key: 'mollusques',  label: 'Mollusques',         emoji: '🦪', desc: 'Huîtres, moules, escargots...' },
]

// ─── Labels qualité ──────────────────────────────────────────────────────────

const QUALITY_LABELS = [
  { key: 'fait_maison',      label: 'Fait Maison',       color: 'bg-amber-100 text-amber-800 border-amber-200',   desc: 'Préparé sur place avec des produits bruts' },
  { key: 'halal',            label: 'Halal',             color: 'bg-green-100 text-green-800 border-green-200',   desc: 'Certifié halal' },
  { key: 'casher',           label: 'Casher',            color: 'bg-blue-100 text-blue-800 border-blue-200',      desc: 'Certifié casher' },
  { key: 'vegetarien',       label: 'Végétarien',        color: 'bg-lime-100 text-lime-800 border-lime-200',      desc: 'Sans viande ni poisson' },
  { key: 'vegan',            label: 'Vegan',             color: 'bg-emerald-100 text-emerald-800 border-emerald-200', desc: 'Sans produits animaux' },
  { key: 'bio',              label: 'Bio',               color: 'bg-green-100 text-green-800 border-green-200',   desc: 'Ingrédients biologiques' },
  { key: 'sans_gluten',      label: 'Sans Gluten',       color: 'bg-yellow-100 text-yellow-800 border-yellow-200', desc: 'Ne contient pas de gluten' },
  { key: 'local',            label: 'Produits Locaux',   color: 'bg-orange-100 text-orange-800 border-orange-200', desc: 'Approvisionnement local' },
  { key: 'epicé',            label: 'Épicé',             color: 'bg-red-100 text-red-800 border-red-200',         desc: 'Plat épicé' },
]

// ─── Section header ──────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, title, desc }: { icon: any; title: string; desc?: string }) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b border-border mb-4">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-sm text-foreground">{title}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
    </div>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface MenuInfoSettingsProps {
  orgId: string
  settings: Record<string, any>
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MenuInfoSettings({ orgId, settings }: MenuInfoSettingsProps) {
  const router = useRouter()
  const [loading, startTransition] = useTransition()

  // State
  const [clientMessage, setClientMessage]         = useState<string>(settings.menu_client_message || '')
  const [legalMentions, setLegalMentions]         = useState<string>(settings.menu_legal_mentions || '')
  const [allergenDisclaimer, setAllergenDisclaimer] = useState<string>(settings.menu_allergen_disclaimer || '')
  const [activeLabels, setActiveLabels]           = useState<string[]>(settings.menu_labels || [])
  const [activeAllergens, setActiveAllergens]     = useState<string[]>(settings.menu_allergens_present || [])

  function toggleLabel(key: string) {
    setActiveLabels(prev =>
      prev.includes(key) ? prev.filter(l => l !== key) : [...prev, key]
    )
  }

  function toggleAllergen(key: string) {
    setActiveAllergens(prev =>
      prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await updateMenuInfoAction({
        orgId,
        clientMessage,
        legalMentions,
        allergenDisclaimer,
        labels: activeLabels,
        allergensPresent: activeAllergens,
      })
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Carte & Allergènes mis à jour !')
        router.refresh()
      }
    })
  }

  return (
    <form id="settings-menu-form" onSubmit={handleSubmit} className="space-y-6 max-w-4xl">

      {/* ── 1. Message client ── */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SectionTitle
            icon={MessageSquare}
            title="Message client"
            desc="Affiché en haut de votre menu public. Idéal pour un message de bienvenue ou une info spéciale."
          />
          <Textarea
            placeholder="Ex : Tous nos plats sont préparés à la commande avec des produits frais. Merci pour votre confiance !"
            value={clientMessage}
            onChange={e => setClientMessage(e.target.value)}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">{clientMessage.length}/300 caractères</p>
        </CardContent>
      </Card>

      {/* ── 2. Labels & Certifications ── */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SectionTitle
            icon={Tag}
            title="Labels & Certifications"
            desc="Les badges sélectionnés apparaîtront sur votre page menu publique."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {QUALITY_LABELS.map(ql => {
              const active = activeLabels.includes(ql.key)
              return (
                <div
                  key={ql.key}
                  role="checkbox"
                  aria-checked={active}
                  tabIndex={0}
                  onClick={() => toggleLabel(ql.key)}
                  onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && toggleLabel(ql.key)}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all cursor-pointer select-none',
                    active
                      ? ql.color + ' ring-2 ring-current/30'
                      : 'border-border bg-card hover:bg-muted/40'
                  )}
                >
                  <Checkbox
                    checked={active}
                    className="mt-0.5 shrink-0 pointer-events-none"
                    aria-hidden
                    tabIndex={-1}
                  />
                  <div>
                    <p className={cn('text-sm font-semibold', active ? '' : 'text-foreground')}>{ql.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{ql.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Aperçu */}
          {activeLabels.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">Aperçu des badges :</p>
              <div className="flex flex-wrap gap-2">
                {activeLabels.map(key => {
                  const ql = QUALITY_LABELS.find(l => l.key === key)
                  if (!ql) return null
                  return (
                    <span key={key} className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', ql.color)}>
                      {ql.label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 3. Allergènes ── */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SectionTitle
            icon={ShieldCheck}
            title="Allergènes présents en cuisine"
            desc="Cochez les allergènes manipulés dans votre cuisine (risque de contamination croisée)."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ALLERGENS.map(al => {
              const active = activeAllergens.includes(al.key)
              return (
                <label
                  key={al.key}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all',
                    active
                      ? 'border-red-300 bg-red-50 text-red-800'
                      : 'border-border hover:bg-muted/40'
                  )}
                >
                  <Checkbox
                    checked={active}
                    onCheckedChange={() => toggleAllergen(al.key)}
                  />
                  <span className="text-lg leading-none">{al.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{al.label}</p>
                    <p className="text-xs text-muted-foreground">{al.desc}</p>
                  </div>
                </label>
              )
            })}
          </div>

          {/* Message personnalisé allergènes */}
          <div className="space-y-1.5 pt-2">
            <Label>Message d'avertissement allergènes (optionnel)</Label>
            <Textarea
              placeholder="Ex : Notre cuisine manipule des traces de noix et d'arachides. En cas d'allergie sévère, merci de nous contacter avant de commander."
              value={allergenDisclaimer}
              onChange={e => setAllergenDisclaimer(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── 4. Mentions légales ── */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <SectionTitle
            icon={FileText}
            title="Mentions légales"
            desc="Texte affiché en bas de votre carte publique (SIRET, responsable, etc.)."
          />
          <Textarea
            placeholder="Ex : SARL MonRestaurant — SIRET 123 456 789 00010 — Responsable de publication : Mahamadou Kaba"
            value={legalMentions}
            onChange={e => setLegalMentions(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* ── Save (desktop portal) ── */}
      <SettingsSavePortal>
        <Button
          type="submit"
          form="settings-menu-form"
          size="lg"
          className="bg-primary hover:bg-primary/90 gap-2 shadow-sm rounded-lg hidden md:flex px-8"
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </Button>
      </SettingsSavePortal>

      {/* ── Save (mobile) ── */}
      <div className="flex justify-end md:hidden sticky bottom-6 bg-background/80 backdrop-blur-sm p-4 border-t border-border rounded-xl shadow-lg z-10">
        <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 gap-2 w-full rounded-lg" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </Button>
      </div>
    </form>
  )
}
