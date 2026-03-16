'use client'

import { useRef, useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Save, Loader2, Plus, Trash2, Mic, StopCircle, Upload,
  Image as ImageIcon, X, Clock, Users, Tag, Link2, Download, BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { upsertRecipeAction, uploadRecipeMediaAction } from '@/actions/recipes'
import { useTranslations } from 'next-intl'

type Product = { id: string; name: string; category: string }
type Ingredient = { name: string; quantity: string; unit: string }
type TimeUnit = 'min' | 'h'

const RECIPE_CATEGORIES = [
  'Entrée', 'Plat principal', 'Accompagnement', 'Sauce',
  'Dessert', 'Boisson', 'Snack', 'Autre'
]

const UNITS = ['g', 'kg', 'ml', 'L', 'cl', 'tasse', 'c. à soupe', 'c. à café', 'pièce(s)', 'tranche(s)', 'pincée', 'au goût']

interface RecipeFormProps {
  orgId: string
  products: Product[]
  initialData?: {
    id: string
    name: string
    description: string | null
    category: string | null
    servings: number | null
    prep_time_minutes: number | null
    cook_time_minutes: number | null
    instructions: string | null
    ingredients_list: Ingredient[]
    images: string[]
    audio_url: string | null
    audio_transcript: string | null
    audio_language: string | null
    tags: string[]
    is_private: boolean
    product_id: string | null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toMinutes(value: string, unit: TimeUnit): number | null {
  const n = parseFloat(value)
  if (!n || isNaN(n)) return null
  return unit === 'h' ? Math.round(n * 60) : Math.round(n)
}

function formatTimeDisplay(value: string, unit: TimeUnit): string {
  if (!value || !parseFloat(value)) return ''
  return unit === 'h' ? `${value}h` : `${value} min`
}

function formatTotalTime(prepMin: number, cookMin: number): string {
  const total = prepMin + cookMin
  if (total <= 0) return ''
  if (total < 60) return `${total} min`
  const h = Math.floor(total / 60)
  const m = total % 60
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

// ─── Logo mark (HTML string for PDF) ─────────────────────────────────────────

const LOGO_HTML = `
<div style="display:flex;align-items:center;justify-content:center;gap:8px">
  <div style="width:22px;height:22px;background:linear-gradient(135deg,#e67e22,#8B4513);border-radius:60% 35% 50% 40%/40% 60% 30% 55%;transform:rotate(-8deg);display:flex;align-items:center;justify-content:center;flex-shrink:0">
    <span style="font-size:7px;font-weight:800;color:white;display:block;transform:rotate(8deg);letter-spacing:-0.03em">rOS</span>
  </div>
  <span style="font-family:'Playfair Display',serif;font-size:13px;font-weight:700;color:#555">Restaurant<span style="color:#e67e22">OS</span></span>
</div>`

// ─── PDF generator ────────────────────────────────────────────────────────────

function buildRecipePDF({
  name, description, category, servings,
  prepTime, prepUnit, cookTime, cookUnit,
  ingredients, instructions, images, tags
}: {
  name: string; description: string; category: string; servings: string
  prepTime: string; prepUnit: TimeUnit; cookTime: string; cookUnit: TimeUnit
  ingredients: Ingredient[]; instructions: string; images: string[]; tags: string[]
}) {
  const prepMin = toMinutes(prepTime, prepUnit) ?? 0
  const cookMin = toMinutes(cookTime, cookUnit) ?? 0
  const totalStr = formatTotalTime(prepMin, cookMin)
  const steps = instructions.split('\n').filter(s => s.trim())
  const validIngredients = ingredients.filter(i => i.name.trim())

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>${name || 'Recette'}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;background:#fff;color:#1a1a1a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{max-width:680px;margin:0 auto;padding:48px}
  .cover{width:100%;height:260px;object-fit:cover;border-radius:14px;margin-bottom:32px;display:block}
  .cover-placeholder{width:100%;height:220px;background:linear-gradient(135deg,#7c3d12,#c05621,#e67e22);border-radius:14px;margin-bottom:32px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px}
  .cover-placeholder-title{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:white;text-align:center;padding:0 32px;word-break:break-word}
  .cover-placeholder-cat{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.6);font-weight:600}
  .cat{text-transform:uppercase;font-size:10px;letter-spacing:3px;color:#b08d5b;font-weight:600;margin-bottom:10px}
  h1{font-family:'Playfair Display',serif;font-size:34px;font-weight:700;line-height:1.15;margin-bottom:14px;color:#111;word-break:break-word}
  .desc{font-size:14px;color:#666;line-height:1.7;margin-bottom:28px;word-break:break-word}
  .divider{border:none;border-top:1px solid #ece8e0;margin:26px 0}
  .meta{display:flex;justify-content:center;gap:40px;padding:6px 0}
  .meta-item{text-align:center}
  .meta-val{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:#111}
  .meta-unit{font-size:11px;color:#b08d5b;font-weight:600}
  .meta-lbl{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-top:2px}
  .sec{margin-bottom:30px}
  .sec-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:#111;display:flex;align-items:center;gap:10px;margin-bottom:18px}
  .sec-title::after{content:'';flex:1;height:1px;background:#ece8e0}
  .ing-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 32px}
  .ing{display:flex;align-items:baseline;gap:8px;font-size:13px;padding:7px 0;border-bottom:1px solid #f5f2ee}
  .ing-qty{font-weight:600;color:#b08d5b;min-width:70px;font-size:12px}
  .ing-name{color:#333;word-break:break-word}
  .step{display:flex;gap:14px;margin-bottom:16px;page-break-inside:avoid}
  .step-n{width:26px;height:26px;background:#1a1a1a;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;margin-top:2px}
  .step-t{font-size:13px;line-height:1.75;color:#333;word-break:break-word;overflow-wrap:anywhere}
  .tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
  .tag{font-size:11px;padding:4px 12px;background:#f5f2ee;border-radius:999px;color:#888}
  .footer{margin-top:40px;padding-top:20px;border-top:1px solid #ece8e0;text-align:center}
  @media print{.page{padding:28px 36px}}
</style>
</head>
<body>
<div class="page">
  ${images[0]
    ? `<img class="cover" src="${images[0]}" alt="${name}" />`
    : `<div class="cover-placeholder">
        ${category ? `<div class="cover-placeholder-cat">${category}</div>` : ''}
        ${name ? `<div class="cover-placeholder-title">${name}</div>` : ''}
       </div>`
  }
  ${!images[0] && category ? '' : category ? `<div class="cat">${category}</div>` : ''}
  ${images[0] ? `<h1>${name || 'Ma recette'}</h1>` : `<h1 style="margin-top:8px">${name || 'Ma recette'}</h1>`}
  ${description ? `<p class="desc">${description}</p>` : ''}
  ${(servings || prepTime || cookTime) ? `
    <div class="meta">
      ${servings ? `<div class="meta-item"><div class="meta-val">${servings}</div><div class="meta-unit">pers.</div><div class="meta-lbl">Portions</div></div>` : ''}
      ${prepTime ? `<div class="meta-item"><div class="meta-val">${prepTime}</div><div class="meta-unit">${prepUnit}</div><div class="meta-lbl">Préparation</div></div>` : ''}
      ${cookTime ? `<div class="meta-item"><div class="meta-val">${cookTime}</div><div class="meta-unit">${cookUnit}</div><div class="meta-lbl">Cuisson</div></div>` : ''}
      ${totalStr ? `<div class="meta-item"><div class="meta-val" style="color:#b08d5b">${totalStr}</div><div class="meta-unit" style="color:#b08d5b">&nbsp;</div><div class="meta-lbl">Total</div></div>` : ''}
    </div>
    <hr class="divider" />
  ` : '<hr class="divider" />'}
  ${validIngredients.length > 0 ? `
    <div class="sec">
      <div class="sec-title">Ingrédients</div>
      <div class="ing-grid">
        ${validIngredients.map(ing => `
          <div class="ing">
            <span class="ing-qty">${ing.quantity ? `${ing.quantity} ${ing.unit}` : '—'}</span>
            <span class="ing-name">${ing.name}</span>
          </div>`).join('')}
      </div>
    </div>
  ` : ''}
  ${steps.length > 0 ? `
    <div class="sec">
      <div class="sec-title">Préparation</div>
      <div>
        ${steps.map((s, i) => `
          <div class="step">
            <div class="step-n">${i + 1}</div>
            <div class="step-t">${s.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '')}</div>
          </div>`).join('')}
      </div>
    </div>
  ` : ''}
  ${tags.length > 0 ? `<div class="tags">${tags.map(t => `<span class="tag">#${t}</span>`).join('')}</div>` : ''}
  <div class="footer">${LOGO_HTML}</div>
</div>
<script>window.onload=()=>window.print()</script>
</body>
</html>`
}

// ─── Recipe Sheet Preview ─────────────────────────────────────────────────────

function RecipeSheetPreview({
  name, description, category, servings,
  prepTime, prepUnit, cookTime, cookUnit,
  ingredients, instructions, images, tags,
  onDownload
}: {
  name: string; description: string; category: string; servings: string
  prepTime: string; prepUnit: TimeUnit; cookTime: string; cookUnit: TimeUnit
  ingredients: Ingredient[]; instructions: string; images: string[]; tags: string[]
  onDownload: () => void
}) {
  const t = useTranslations('dashboard.recipes')
  const thumb = images[0]
  const prepMin = toMinutes(prepTime, prepUnit) ?? 0
  const cookMin = toMinutes(cookTime, cookUnit) ?? 0
  const totalStr = formatTotalTime(prepMin, cookMin)
  const steps = instructions.split('\n').filter(s => s.trim())
  const validIngredients = ingredients.filter(i => i.name.trim())

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t('preview')}</p>
        <Button type="button" size="sm" variant="outline" onClick={onDownload} className="gap-1.5 h-8 text-xs">
          <Download className="h-3.5 w-3.5" />
          {t('downloadPDF')}
        </Button>
      </div>

      {/* La feuille */}
      <div className="bg-white dark:bg-zinc-50 border border-border rounded-2xl overflow-hidden shadow-lg text-zinc-900">

        {/* Photo ou placeholder */}
        {thumb ? (
          <div className="relative w-full aspect-[16/9] overflow-hidden">
            <img src={thumb} alt={name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            {category && (
              <span className="absolute bottom-3 left-4 text-[10px] uppercase tracking-[0.2em] text-white/90 font-semibold">
                {category}
              </span>
            )}
          </div>
        ) : (
          /* Gradient placeholder avec nom de la recette */
          <div className="relative w-full aspect-[16/9] overflow-hidden bg-gradient-to-br from-amber-950 via-orange-800 to-amber-700 flex flex-col items-center justify-center gap-2 px-6">
            {/* Motif de points */}
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }}
            />
            <BookOpen className="h-7 w-7 text-white/20 mb-1" />
            {name ? (
              <h3 className="font-serif text-white text-center font-bold text-base leading-snug line-clamp-2 relative">
                {name}
              </h3>
            ) : (
              <p className="text-white/30 text-xs relative">{t('recipePreview')}</p>
            )}
            {category && (
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 relative">{category}</p>
            )}
          </div>
        )}

        <div className="p-5">
          {/* Catégorie (si pas de photo) */}
          {!thumb && category && null /* already shown in placeholder */}

          {/* Titre */}
          {thumb && (
            <>
              {category && (
                <p className="text-[10px] uppercase tracking-[0.2em] text-amber-700 font-semibold mb-1.5">{category}</p>
              )}
              <h2 className="font-serif text-lg font-bold text-zinc-900 leading-snug break-words mb-1">{name || <span className="text-zinc-300">Nom de la recette</span>}</h2>
            </>
          )}
          {!thumb && name && (
            <h2 className="font-serif text-lg font-bold text-zinc-900 leading-snug break-words mb-1 mt-1">{name}</h2>
          )}

          {/* Description */}
          {description && (
            <p className="text-xs text-zinc-500 leading-relaxed mt-1.5 mb-3 break-words line-clamp-3">{description}</p>
          )}

          {/* Meta temps / portions */}
          {(servings || prepTime || cookTime) && (
            <>
              <div className="h-px bg-zinc-100 my-3" />
              <div className="flex justify-around gap-2 py-1">
                {servings && (
                  <div className="text-center">
                    <p className="font-serif text-base font-bold text-zinc-900 leading-none">{servings}</p>
                    <p className="text-[9px] text-amber-700 font-semibold uppercase tracking-wide mt-0.5">pers.</p>
                    <p className="text-[9px] text-zinc-400 uppercase tracking-wide">Portions</p>
                  </div>
                )}
                {prepTime && (
                  <div className="text-center">
                    <p className="font-serif text-base font-bold text-zinc-900 leading-none">{prepTime}</p>
                    <p className="text-[9px] text-amber-700 font-semibold uppercase tracking-wide mt-0.5">{prepUnit}</p>
                    <p className="text-[9px] text-zinc-400 uppercase tracking-wide">Prépa</p>
                  </div>
                )}
                {cookTime && (
                  <div className="text-center">
                    <p className="font-serif text-base font-bold text-zinc-900 leading-none">{cookTime}</p>
                    <p className="text-[9px] text-amber-700 font-semibold uppercase tracking-wide mt-0.5">{cookUnit}</p>
                    <p className="text-[9px] text-zinc-400 uppercase tracking-wide">Cuisson</p>
                  </div>
                )}
                {totalStr && (
                  <div className="text-center">
                    <p className="font-serif text-base font-bold text-amber-700 leading-none">{totalStr}</p>
                    <p className="text-[9px] text-amber-400 font-semibold uppercase tracking-wide mt-0.5">&nbsp;</p>
                    <p className="text-[9px] text-zinc-400 uppercase tracking-wide">Total</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Ingrédients */}
          {validIngredients.length > 0 && (
            <>
              <div className="h-px bg-zinc-100 my-3" />
              <div>
                <p className="text-[9px] uppercase tracking-[0.15em] font-semibold text-zinc-400 mb-2.5 flex items-center gap-2">
                  Ingrédients <span className="flex-1 h-px bg-zinc-100" />
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0">
                  {validIngredients.map((ing, i) => (
                    <div key={i} className="flex items-baseline gap-1.5 py-1 border-b border-zinc-50 text-xs">
                      <span className="font-semibold text-amber-700 min-w-[44px] text-[10px] shrink-0">
                        {ing.quantity ? `${ing.quantity} ${ing.unit}` : '—'}
                      </span>
                      <span className="text-zinc-700 leading-tight break-words min-w-0">{ing.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Instructions */}
          {steps.length > 0 && (
            <>
              <div className="h-px bg-zinc-100 my-3" />
              <div>
                <p className="text-[9px] uppercase tracking-[0.15em] font-semibold text-zinc-400 mb-2.5 flex items-center gap-2">
                  Préparation <span className="flex-1 h-px bg-zinc-100" />
                </p>
                <ol className="space-y-2.5">
                  {steps.slice(0, 6).map((step, i) => (
                    <li key={i} className="flex gap-2.5 items-start">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-zinc-900 text-white text-[9px] font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-[11px] text-zinc-600 leading-relaxed break-words overflow-wrap-anywhere min-w-0">
                        {step.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '')}
                      </p>
                    </li>
                  ))}
                  {steps.length > 6 && (
                    <li className="text-[10px] text-zinc-400 italic pl-7">{t('moreSteps', { count: steps.length - 6 })}</li>
                  )}
                </ol>
              </div>
            </>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <>
              <div className="h-px bg-zinc-100 my-3" />
              <div className="flex flex-wrap gap-1">
                {tags.map(t => (
                  <span key={t} className="text-[9px] px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-full">#{t}</span>
                ))}
              </div>
            </>
          )}

          {/* Logo footer */}
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-center gap-2 opacity-40">
            <div
              className="h-4 w-4 flex items-center justify-center bg-gradient-to-br from-[#e67e22] to-[#8B4513] shrink-0"
              style={{ borderRadius: '60% 35% 50% 40% / 40% 60% 30% 55%', transform: 'rotate(-8deg)' }}
            >
              <span className="text-[6px] font-extrabold text-white" style={{ transform: 'rotate(8deg)', letterSpacing: '-0.03em' }}>
                rOS
              </span>
            </div>
            <span className="font-serif text-[11px] font-bold text-zinc-600">
              Restaurant<span className="text-[#e67e22]">OS</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

export function RecipeForm({ orgId, products, initialData }: RecipeFormProps) {
  const t = useTranslations('dashboard.recipes')
  const tc = useTranslations('common')
  const router = useRouter()
  const [saving, startSave] = useTransition()

  // ── Fields ──
  const [name, setName] = useState(initialData?.name ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [category, setCategory] = useState(initialData?.category ?? '')
  const [servings, setServings] = useState(initialData?.servings?.toString() ?? '')
  const [prepTime, setPrepTime] = useState(initialData?.prep_time_minutes?.toString() ?? '')
  const [prepUnit, setPrepUnit] = useState<TimeUnit>('min')
  const [cookTime, setCookTime] = useState(initialData?.cook_time_minutes?.toString() ?? '')
  const [cookUnit, setCookUnit] = useState<TimeUnit>('min')
  const [instructions, setInstructions] = useState(initialData?.instructions ?? '')
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialData?.ingredients_list?.length
      ? initialData.ingredients_list
      : [{ name: '', quantity: '', unit: 'g' }]
  )
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [isPrivate, setIsPrivate] = useState(initialData?.is_private ?? false)
  const [linkedProductId, setLinkedProductId] = useState<string>(initialData?.product_id ?? 'none')

  // ── Images ──
  const [images, setImages] = useState<string[]>(initialData?.images ?? [])
  const [uploadingImg, setUploadingImg] = useState(false)
  const imgInputRef = useRef<HTMLInputElement>(null)

  // ── Ingredient name refs (pour l'auto-focus) ──
  const ingNameRefs = useRef<(HTMLInputElement | null)[]>([])
  const justAddedIngredient = useRef(false)

  // ── Audio ──
  const [audioUrl, setAudioUrl] = useState<string | null>(initialData?.audio_url ?? null)
  const [audioTranscript, setAudioTranscript] = useState(initialData?.audio_transcript ?? '')
  const [audioLanguage, setAudioLanguage] = useState<'fr' | 'en'>(
    (initialData?.audio_language as 'fr' | 'en') ?? 'fr'
  )
  const [recording, setRecording] = useState(false)
  const [uploadingAudio, setUploadingAudio] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioFileInputRef = useRef<HTMLInputElement>(null)

  // ─── Product link → auto-name ─────────────────────────────────────────────

  function handleProductChange(productId: string) {
    const prevProduct = products.find(p => p.id === linkedProductId)
    const autoName = prevProduct ? t('preparationOf', { name: prevProduct.name }) : ''
    setLinkedProductId(productId)
    if (productId === 'none') {
      if (name === autoName) setName('')
      return
    }
    const nextProduct = products.find(p => p.id === productId)
    if (!nextProduct) return
    if (!name.trim() || name === autoName) {
      setName(t('preparationOf', { name: nextProduct.name }))
    }
  }

  // ─── Ingredients helpers ──────────────────────────────────────────────────

  useEffect(() => {
    if (justAddedIngredient.current) {
      justAddedIngredient.current = false
      ingNameRefs.current[ingredients.length - 1]?.focus()
    }
  }, [ingredients.length])

  function addIngredient() {
    justAddedIngredient.current = true
    setIngredients(prev => [...prev, { name: '', quantity: '', unit: 'g' }])
  }

  function updateIngredient(i: number, field: keyof Ingredient, val: string) {
    setIngredients(prev => prev.map((ing, idx) => idx === i ? { ...ing, [field]: val } : ing))
  }

  function removeIngredient(i: number) {
    setIngredients(prev => prev.filter((_, idx) => idx !== i))
  }

  // ─── Tags ─────────────────────────────────────────────────────────────────

  function addTag(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const t = tagInput.trim().toLowerCase()
      if (!tags.includes(t)) setTags(prev => [...prev, t])
      setTagInput('')
    }
  }

  // ─── Image upload ─────────────────────────────────────────────────────────

  async function uploadRecipeFile(file: File, mediaType: 'image' | 'audio') {
    const payload = new FormData()
    payload.append('file', file)
    payload.append('mediaType', mediaType)
    const result = await uploadRecipeMediaAction(payload)
    if (result.error || !result.url) {
      throw new Error(result.error || 'Erreur inconnue')
    }
    return result.url
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    try {
      const publicUrl = await uploadRecipeFile(file, 'image')
      setImages(prev => [...prev, publicUrl])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errorUploadImage'))
    } finally {
      setUploadingImg(false)
    }
    e.target.value = ''
  }

  // ─── Audio — upload fichier ───────────────────────────────────────────────

  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAudio(true)
    try {
      const publicUrl = await uploadRecipeFile(file, 'audio')
      setAudioUrl(publicUrl)
      toast.success(t('audioSaved'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('errorUploadAudio'))
    } finally {
      setUploadingAudio(false)
    }
  }

  // ─── Audio — enregistrement micro ────────────────────────────────────────

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'audio/webm' })
        setUploadingAudio(true)
        try {
          const publicUrl = await uploadRecipeFile(file, 'audio')
          setAudioUrl(publicUrl)
          toast.success(t('recordingSaved'))
        } catch (error) {
          toast.error(error instanceof Error ? error.message : t('errorUploadAudio'))
        } finally {
          setUploadingAudio(false)
        }
      }
      mr.start()
      mediaRecorderRef.current = mr
      setRecording(true)
    } catch {
      toast.error(t('micNotAccessible'))
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  // ─── PDF download ─────────────────────────────────────────────────────────

  function handleDownloadPDF() {
    const html = buildRecipePDF({
      name, description, category, servings,
      prepTime, prepUnit, cookTime, cookUnit,
      ingredients, instructions, images, tags
    })
    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close() }
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  function handleSave() {
    if (!name.trim()) { toast.error(t('nameRequired')); return }
    startSave(async () => {
      const result = await upsertRecipeAction({
        id:              initialData?.id,
        organizationId:  orgId,
        productId:       linkedProductId === 'none' ? null : linkedProductId,
        name:            name.trim(),
        description:     description || undefined,
        category:        category || undefined,
        servings:        servings ? parseInt(servings) : null,
        prepTimeMinutes: toMinutes(prepTime, prepUnit),
        cookTimeMinutes: toMinutes(cookTime, cookUnit),
        instructions:    instructions || undefined,
        ingredientsList: ingredients.filter(i => i.name.trim()),
        images,
        audioUrl:        audioUrl || null,
        audioTranscript: audioTranscript || null,
        audioLanguage:   audioTranscript ? audioLanguage : null,
        tags,
        isPrivate,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(initialData ? t('recipeUpdated') : t('recipeCreated'))
        router.push('/dashboard/recipes')
        router.refresh()
      }
    })
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] 2xl:grid-cols-[1fr_420px] gap-8 items-start">

      {/* ── Colonne gauche : formulaire ── */}
      <div className="space-y-6 pb-28">

        {/* Infos générales */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label>{t('recipeName')}</Label>
                <Input
                  placeholder={t('namePlaceholder')}
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{tc('category')}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder={t('chooseCategory')} /></SelectTrigger>
                  <SelectContent>
                    {RECIPE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5" />{t('linkToProduct')}
                </Label>
                <Select value={linkedProductId} onValueChange={handleProductChange}>
                  <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} <span className="text-muted-foreground">· {p.category}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t('shortDescription')}</Label>
              <Textarea
                placeholder={t('descPlaceholder')}
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {/* Portions */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{t('portions')}</Label>
                <Input type="number" min="1" placeholder="4" value={servings} onChange={e => setServings(e.target.value)} />
              </div>

              {/* Temps de préparation */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{t('preparation')}</Label>
                <div className="flex gap-1.5">
                  <Input type="number" min="0" placeholder="20" value={prepTime} onChange={e => setPrepTime(e.target.value)} className="min-w-0" />
                  <Select value={prepUnit} onValueChange={(v) => setPrepUnit(v as TimeUnit)}>
                    <SelectTrigger className="w-20 shrink-0"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="min">min</SelectItem>
                      <SelectItem value="h">h</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Temps de cuisson */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{t('cooking')}</Label>
                <div className="flex gap-1.5">
                  <Input type="number" min="0" placeholder="45" value={cookTime} onChange={e => setCookTime(e.target.value)} className="min-w-0" />
                  <Select value={cookUnit} onValueChange={(v) => setCookUnit(v as TimeUnit)}>
                    <SelectTrigger className="w-20 shrink-0"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="min">min</SelectItem>
                      <SelectItem value="h">h</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ingrédients */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">{t('ingredients')}</Label>
              <Button type="button" size="sm" variant="outline" onClick={addIngredient}>
                <Plus className="h-3.5 w-3.5 mr-1" />Ajouter
              </Button>
            </div>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-center">
                  <Input
                    ref={el => { ingNameRefs.current[i] = el }}
                    placeholder={t('ingredient')}
                    value={ing.name}
                    onChange={e => updateIngredient(i, 'name', e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); addIngredient() }
                    }}
                  />
                  <Input placeholder={tc('quantity')} value={ing.quantity} onChange={e => updateIngredient(i, 'quantity', e.target.value)} />
                  <Select value={ing.unit} onValueChange={v => updateIngredient(i, 'unit', v)}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" size="icon" variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeIngredient(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardContent className="pt-6 space-y-2">
            <Label className="text-base font-semibold">{t('instructions')}</Label>
            <Textarea
              placeholder={t('instructionsPlaceholder')}
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">{t('photos')}</Label>
              <Button type="button" size="sm" variant="outline" onClick={() => imgInputRef.current?.click()} disabled={uploadingImg}>
                {uploadingImg ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <ImageIcon className="h-3.5 w-3.5 mr-1" />}
                {t('addPhoto')}
              </Button>
              <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </div>
            {images.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {images.map((url, i) => (
                  <div key={i} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-border bg-muted">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-black/70 text-white rounded-full p-0.5 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center py-8 text-muted-foreground text-sm cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => imgInputRef.current?.click()}
              >
                <ImageIcon className="h-8 w-8 mb-2 opacity-40" />
                <p>{t('clickToAddPhotos')}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{t('supportedFormats')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audio */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Label className="text-base font-semibold">{t('audioRecording')}</Label>
            <p className="text-sm text-muted-foreground -mt-2">
              {t('audioDesc')}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {!recording ? (
                <Button type="button" variant="outline" onClick={startRecording} className="gap-2 border-red-300 text-red-600 hover:bg-red-50">
                  <Mic className="h-4 w-4" />{t('recordMic')}
                </Button>
              ) : (
                <Button type="button" variant="destructive" onClick={stopRecording} className="gap-2 animate-pulse">
                  <StopCircle className="h-4 w-4" />{t('stopRecording')}
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => audioFileInputRef.current?.click()} disabled={uploadingAudio} className="gap-2">
                {uploadingAudio ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {t('importAudioFile')}
              </Button>
              <input ref={audioFileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
            </div>
            {audioUrl && (
              <div className="space-y-2">
                <audio controls src={audioUrl} className="w-full h-10 rounded-lg" />
                <Button type="button" size="sm" variant="ghost" className="text-xs text-muted-foreground hover:text-destructive" onClick={() => setAudioUrl(null)}>
                  <X className="h-3 w-3 mr-1" /> {t('deleteAudio')}
                </Button>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('transcription')}</Label>
                <Select value={audioLanguage} onValueChange={(v) => setAudioLanguage(v as 'fr' | 'en')}>
                  <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">{t('french')}</SelectItem>
                    <SelectItem value="en">{t('english')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder={t('transcriptionPlaceholder')}
                value={audioTranscript}
                onChange={e => setAudioTranscript(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tags & Confidentialité */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" />{t('tags')}</Label>
              <Input
                placeholder={t('tagsPlaceholder')}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                      {t}
                      <button type="button" onClick={() => setTags(prev => prev.filter(x => x !== t))}>
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <p className="text-sm font-medium">{t('privateRecipe')}</p>
                <p className="text-xs text-muted-foreground">{t('privateRecipeDesc')}</p>
              </div>
              <Checkbox checked={isPrivate} onCheckedChange={(v) => setIsPrivate(v === true)} />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t border-border p-4 -mx-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>{tc('cancel')}</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-white px-8">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? tc('saving') : initialData ? t('updateRecipe') : t('createRecipe')}
          </Button>
        </div>
      </div>

      {/* ── Colonne droite : feuille de recette ── */}
      <div className="sticky top-24 hidden xl:block">
        <RecipeSheetPreview
          name={name}
          description={description}
          category={category}
          servings={servings}
          prepTime={prepTime}
          prepUnit={prepUnit}
          cookTime={cookTime}
          cookUnit={cookUnit}
          ingredients={ingredients}
          instructions={instructions}
          images={images}
          tags={tags}
          onDownload={handleDownloadPDF}
        />
      </div>

    </div>
  )
}
