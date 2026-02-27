'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
    Edit2, Trash2, Clock, Users, Mic, Link2, BookOpen, Lock,
    Search, FolderOpen, FolderPlus, Plus, Check, X, MoreHorizontal,
    Folder, FileSpreadsheet
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ViewToggle, type ViewMode } from '@/components/ui/view-toggle'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
    deleteRecipeAction, createFolderAction, deleteFolderAction,
    renameFolderAction, moveRecipeToFolderAction
} from '@/actions/recipes'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ImportRecipesDialog } from '@/components/dashboard/recipes/ImportRecipesDialog'

// ─── Types ────────────────────────────────────────────────────────────────────

type Folder = { id: string; name: string; color: string }

type Recipe = {
    id: string
    name: string
    description: string | null
    category: string | null
    servings: number | null
    prep_time_minutes: number | null
    cook_time_minutes: number | null
    images: string[]
    audio_url: string | null
    tags: string[]
    is_private: boolean
    folder_id: string | null
    created_at: string
    products: { id: string; name: string; category: string } | null
}

// ─── Folder colors ────────────────────────────────────────────────────────────

const FOLDER_COLORS = [
    '#e67e22', '#3498db', '#2ecc71', '#9b59b6',
    '#e74c3c', '#1abc9c', '#f39c12', '#34495e',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function totalMin(r: Recipe) {
    return (r.prep_time_minutes ?? 0) + (r.cook_time_minutes ?? 0)
}

function formatTime(min: number) {
    if (min <= 0) return null
    if (min < 60) return `${min} min`
    const h = Math.floor(min / 60)
    const m = min % 60
    return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

// ─── Subcomponent: folder pill ────────────────────────────────────────────────

function FolderPill({
    folder, count, active, onClick,
    onRename, onDelete,
}: {
    folder: Folder; count: number; active: boolean
    onClick: () => void; onRename: (id: string) => void; onDelete: (id: string) => void
}) {
    return (
        <div className={cn(
            'group flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium cursor-pointer transition-all select-none',
            active
                ? 'border-transparent text-white shadow-sm'
                : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground bg-card'
        )}
            style={active ? { backgroundColor: folder.color } : {}}
            onClick={onClick}
        >
            <Folder className="h-3.5 w-3.5 shrink-0" style={{ color: active ? 'white' : folder.color }} />
            <span>{folder.name}</span>
            <span className={cn('text-xs rounded-full px-1.5 py-0.5 tabular-nums', active ? 'bg-white/20' : 'bg-muted')}>
                {count}
            </span>
            {/* Actions dossier */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                    <button className={cn(
                        'ml-0.5 h-4 w-4 rounded-full flex items-center justify-center transition-opacity',
                        active ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover:opacity-60 hover:!opacity-100'
                    )}>
                        <MoreHorizontal className="h-3 w-3" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                    <DropdownMenuItem onClick={e => { e.stopPropagation(); onRename(folder.id) }}>
                        Renommer
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={e => { e.stopPropagation(); onDelete(folder.id) }}
                    >
                        Supprimer
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

// ─── Subcomponent: recipe card (grid) ────────────────────────────────────────

function RecipeCard({
    recipe, folder, folders,
    onDelete, onMove,
}: {
    recipe: Recipe
    folder: Folder | null
    folders: Folder[]
    onDelete: (id: string) => void
    onMove: (recipeId: string, folderId: string | null) => void
}) {
    const time = formatTime(totalMin(recipe))
    const thumb = recipe.images?.[0]

    return (
        <div className="group relative bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all">
            {/* Image / placeholder — cliquable pour éditer */}
            <Link href={`/dashboard/recipes/${recipe.id}`} className="block">
                <div className="aspect-video bg-muted relative overflow-hidden">
                    {thumb ? (
                        <img src={thumb} alt={recipe.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-950/60 via-orange-800/40 to-amber-700/30">
                            <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                    )}

                    {/* Badges top-left */}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                        {recipe.audio_url && (
                            <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                                <Mic className="h-2.5 w-2.5" /> Audio
                            </span>
                        )}
                        {recipe.is_private && (
                            <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                                <Lock className="h-2.5 w-2.5" /> Privée
                            </span>
                        )}
                    </div>

                    {recipe.category && (
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 text-xs font-semibold bg-black/60 text-white rounded backdrop-blur-sm">
                            {recipe.category}
                        </span>
                    )}
                </div>
            </Link>

            {/* Actions top-right — hors du Link */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/90 shadow-sm hover:bg-white">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem asChild>
                            <Link href={`/dashboard/recipes/${recipe.id}`} className="flex items-center gap-2">
                                <Edit2 className="h-3.5 w-3.5" /> Modifier
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                            Déplacer vers
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => onMove(recipe.id, null)}
                            className={cn('gap-2', !recipe.folder_id && 'text-primary font-medium')}
                        >
                            <FolderOpen className="h-3.5 w-3.5" />
                            Sans dossier
                            {!recipe.folder_id && <Check className="h-3 w-3 ml-auto" />}
                        </DropdownMenuItem>
                        {folders.map(f => (
                            <DropdownMenuItem
                                key={f.id}
                                onClick={() => onMove(recipe.id, f.id)}
                                className={cn('gap-2', recipe.folder_id === f.id && 'text-primary font-medium')}
                            >
                                <Folder className="h-3.5 w-3.5" style={{ color: f.color }} />
                                {f.name}
                                {recipe.folder_id === f.id && <Check className="h-3 w-3 ml-auto" />}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive gap-2"
                            onClick={() => onDelete(recipe.id)}
                        >
                            <Trash2 className="h-3.5 w-3.5" /> Supprimer
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Contenu */}
            <Link href={`/dashboard/recipes/${recipe.id}`} className="block p-4">
                <h3 className="font-bold font-serif text-secondary line-clamp-1 mb-1">{recipe.name}</h3>
                {recipe.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{recipe.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    {time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{time}</span>}
                    {recipe.servings && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{recipe.servings} pers.</span>}
                    {recipe.products && (
                        <span className="flex items-center gap-1 text-primary">
                            <Link2 className="h-3 w-3" />{recipe.products.name}
                        </span>
                    )}
                </div>
                <div className="flex items-center justify-between mt-2">
                    {recipe.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {recipe.tags.slice(0, 2).map(t => (
                                <span key={t} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{t}</span>
                            ))}
                            {recipe.tags.length > 2 && (
                                <span className="text-[10px] text-muted-foreground">+{recipe.tags.length - 2}</span>
                            )}
                        </div>
                    )}
                    {folder && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ml-auto" style={{ backgroundColor: folder.color + '22', color: folder.color }}>
                            <Folder className="h-2.5 w-2.5" />{folder.name}
                        </span>
                    )}
                </div>
            </Link>
        </div>
    )
}

// ─── Subcomponent: recipe row (list) ─────────────────────────────────────────

function RecipeRow({
    recipe, folder, folders,
    onDelete, onMove,
}: {
    recipe: Recipe
    folder: Folder | null
    folders: Folder[]
    onDelete: (id: string) => void
    onMove: (recipeId: string, folderId: string | null) => void
}) {
    const time = formatTime(totalMin(recipe))
    const thumb = recipe.images?.[0]

    return (
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
            {/* Thumbnail */}
            <Link href={`/dashboard/recipes/${recipe.id}`} className="shrink-0">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border border-border">
                    {thumb ? (
                        <img src={thumb} alt={recipe.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-950/40 to-orange-700/30">
                            <BookOpen className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                    )}
                </div>
            </Link>

            {/* Nom + description */}
            <Link href={`/dashboard/recipes/${recipe.id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold font-serif text-sm text-foreground truncate">{recipe.name}</p>
                    {recipe.audio_url && <Mic className="h-3 w-3 text-muted-foreground shrink-0" />}
                    {recipe.is_private && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                </div>
                {recipe.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{recipe.description}</p>
                )}
            </Link>

            {/* Catégorie */}
            <div className="hidden md:block w-28 shrink-0">
                {recipe.category && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {recipe.category}
                    </span>
                )}
            </div>

            {/* Dossier */}
            <div className="hidden lg:block w-32 shrink-0">
                {folder && (
                    <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 w-fit" style={{ backgroundColor: folder.color + '22', color: folder.color }}>
                        <Folder className="h-3 w-3" />{folder.name}
                    </span>
                )}
            </div>

            {/* Temps */}
            <div className="hidden sm:block w-20 shrink-0 text-xs text-muted-foreground">
                {time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{time}</span>}
            </div>

            {/* Tags */}
            <div className="hidden xl:flex items-center gap-1 w-32 shrink-0">
                {recipe.tags.slice(0, 2).map(t => (
                    <span key={t} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full truncate">{t}</span>
                ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                    <Link href={`/dashboard/recipes/${recipe.id}`}><Edit2 className="h-3.5 w-3.5" /></Link>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                            Déplacer vers
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => onMove(recipe.id, null)}
                            className={cn('gap-2', !recipe.folder_id && 'text-primary font-medium')}
                        >
                            <FolderOpen className="h-3.5 w-3.5" />Sans dossier
                            {!recipe.folder_id && <Check className="h-3 w-3 ml-auto" />}
                        </DropdownMenuItem>
                        {folders.map(f => (
                            <DropdownMenuItem
                                key={f.id}
                                onClick={() => onMove(recipe.id, f.id)}
                                className={cn('gap-2', recipe.folder_id === f.id && 'text-primary font-medium')}
                            >
                                <Folder className="h-3.5 w-3.5" style={{ color: f.color }} />
                                {f.name}
                                {recipe.folder_id === f.id && <Check className="h-3 w-3 ml-auto" />}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive gap-2"
                            onClick={() => onDelete(recipe.id)}
                        >
                            <Trash2 className="h-3.5 w-3.5" /> Supprimer
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RecipesClient({
    recipes: initial,
    folders: initialFolders,
    orgId,
}: {
    recipes: Recipe[]
    folders: Folder[]
    orgId: string
}) {
    const router = useRouter()

    // ── State ──
    const [recipes, setRecipes] = useState(initial)
    const [folders, setFolders] = useState(initialFolders)

    // Sync avec les props serveur après router.refresh()
    useEffect(() => { setRecipes(initial) }, [initial])
    useEffect(() => { setFolders(initialFolders) }, [initialFolders])
    const [view, setView] = useState<ViewMode>('grid')
    const [search, setSearch] = useState('')
    const [activeFolder, setActiveFolder] = useState<string | 'all' | 'unassigned'>('all')
    const [showImport, setShowImport] = useState(false)

    // Recipe actions
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [deleting, startDelete] = useTransition()

    // Folder creation
    const [showNewFolder, setShowNewFolder] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')
    const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0])
    const [creatingFolder, startCreateFolder] = useTransition()
    const newFolderInputRef = useRef<HTMLInputElement>(null)

    // Folder rename
    const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
    const [renamingName, setRenamingName] = useState('')
    const [, startRename] = useTransition()
    const renameInputRef = useRef<HTMLInputElement>(null)

    // Folder delete
    const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null)
    const [, startDeleteFolder] = useTransition()

    // Focus new folder input on show
    useEffect(() => {
        if (showNewFolder) newFolderInputRef.current?.focus()
    }, [showNewFolder])

    useEffect(() => {
        if (renamingFolderId) renameInputRef.current?.focus()
    }, [renamingFolderId])

    // ── Computed ──
    const filtered = recipes.filter(r => {
        const matchSearch =
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            (r.category ?? '').toLowerCase().includes(search.toLowerCase()) ||
            r.tags.some(t => t.includes(search.toLowerCase()))

        const matchFolder =
            activeFolder === 'all' ? true :
            activeFolder === 'unassigned' ? !r.folder_id :
            r.folder_id === activeFolder

        return matchSearch && matchFolder
    })

    const countForFolder = (fid: string) => recipes.filter(r => r.folder_id === fid).length
    const countUnassigned = recipes.filter(r => !r.folder_id).length
    const folderMap = Object.fromEntries(folders.map(f => [f.id, f]))

    // ── Recipe handlers ──

    function handleDelete() {
        if (!deletingId) return
        startDelete(async () => {
            const res = await deleteRecipeAction(deletingId)
            if (res.error) { toast.error(res.error) }
            else {
                setRecipes(prev => prev.filter(r => r.id !== deletingId))
                toast.success('Recette supprimée')
            }
            setDeletingId(null)
        })
    }

    function handleMove(recipeId: string, folderId: string | null) {
        // Optimistic update
        setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, folder_id: folderId } : r))
        startCreateFolder(async () => {
            const res = await moveRecipeToFolderAction(recipeId, folderId)
            if (res.error) {
                toast.error(res.error)
                setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, folder_id: recipes.find(x => x.id === recipeId)?.folder_id ?? null } : r))
            } else {
                const folder = folderId ? folderMap[folderId] : null
                toast.success(folder ? `Déplacée dans "${folder.name}"` : 'Retirée du dossier')
            }
        })
    }

    // ── Folder handlers ──

    function handleCreateFolder() {
        if (!newFolderName.trim()) return
        startCreateFolder(async () => {
            const res = await createFolderAction(orgId, newFolderName, newFolderColor)
            if (res.error) { toast.error(res.error) }
            else if (res.folder) {
                setFolders(prev => [...prev, res.folder!])
                toast.success(`Dossier "${res.folder.name}" créé`)
            }
            setNewFolderName('')
            setShowNewFolder(false)
        })
    }

    function handleRenameStart(folderId: string) {
        const f = folders.find(x => x.id === folderId)
        if (!f) return
        setRenamingFolderId(folderId)
        setRenamingName(f.name)
    }

    function handleRenameConfirm() {
        if (!renamingFolderId || !renamingName.trim()) { setRenamingFolderId(null); return }
        const id = renamingFolderId
        setFolders(prev => prev.map(f => f.id === id ? { ...f, name: renamingName } : f))
        setRenamingFolderId(null)
        startRename(async () => {
            const res = await renameFolderAction(id, renamingName)
            if (res.error) toast.error(res.error)
        })
    }

    function handleDeleteFolder() {
        if (!deletingFolderId) return
        const folderName = folders.find(f => f.id === deletingFolderId)?.name
        startDeleteFolder(async () => {
            const res = await deleteFolderAction(deletingFolderId)
            if (res.error) { toast.error(res.error) }
            else {
                setFolders(prev => prev.filter(f => f.id !== deletingFolderId))
                setRecipes(prev => prev.map(r => r.folder_id === deletingFolderId ? { ...r, folder_id: null } : r))
                if (activeFolder === deletingFolderId) setActiveFolder('all')
                toast.success(`Dossier "${folderName}" supprimé`)
            }
            setDeletingFolderId(null)
        })
    }

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            {/* ── Toolbar ── */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher une recette..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setShowImport(true)}
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Importer
                    </Button>
                    <ViewToggle view={view} onChange={setView} />
                </div>
            </div>

            {/* ── Dossiers ── */}
            <div className="flex items-center gap-2 flex-wrap mb-5">
                {/* Tous */}
                <button
                    onClick={() => setActiveFolder('all')}
                    className={cn(
                        'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all select-none',
                        activeFolder === 'all'
                            ? 'bg-foreground text-background border-transparent shadow-sm'
                            : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 bg-card'
                    )}
                >
                    <BookOpen className="h-3.5 w-3.5" />
                    Tous
                    <span className={cn('text-xs rounded-full px-1.5 py-0.5 tabular-nums', activeFolder === 'all' ? 'bg-white/20' : 'bg-muted')}>
                        {recipes.length}
                    </span>
                </button>

                {/* Sans dossier */}
                {countUnassigned > 0 && (
                    <button
                        onClick={() => setActiveFolder('unassigned')}
                        className={cn(
                            'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all select-none',
                            activeFolder === 'unassigned'
                                ? 'bg-foreground text-background border-transparent shadow-sm'
                                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 bg-card'
                        )}
                    >
                        <FolderOpen className="h-3.5 w-3.5" />
                        Sans dossier
                        <span className={cn('text-xs rounded-full px-1.5 py-0.5 tabular-nums', activeFolder === 'unassigned' ? 'bg-white/20' : 'bg-muted')}>
                            {countUnassigned}
                        </span>
                    </button>
                )}

                {/* Dossiers */}
                {folders.map(f => {
                    if (renamingFolderId === f.id) {
                        return (
                            <div key={f.id} className="flex items-center gap-1 rounded-full border border-border px-2 py-1 bg-card">
                                <Folder className="h-3.5 w-3.5 shrink-0" style={{ color: f.color }} />
                                <input
                                    ref={renameInputRef}
                                    value={renamingName}
                                    onChange={e => setRenamingName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleRenameConfirm(); if (e.key === 'Escape') setRenamingFolderId(null) }}
                                    onBlur={handleRenameConfirm}
                                    className="text-sm bg-transparent outline-none w-32 text-foreground"
                                />
                                <button onClick={handleRenameConfirm} className="text-primary hover:text-primary/80">
                                    <Check className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => setRenamingFolderId(null)} className="text-muted-foreground hover:text-foreground">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )
                    }
                    return (
                        <FolderPill
                            key={f.id}
                            folder={f}
                            count={countForFolder(f.id)}
                            active={activeFolder === f.id}
                            onClick={() => setActiveFolder(activeFolder === f.id ? 'all' : f.id)}
                            onRename={handleRenameStart}
                            onDelete={id => setDeletingFolderId(id)}
                        />
                    )
                })}

                {/* Nouveau dossier */}
                {showNewFolder ? (
                    <div className="flex items-center gap-2 rounded-full border border-primary/50 px-3 py-1.5 bg-card">
                        <input
                            ref={newFolderInputRef}
                            placeholder="Nom du dossier"
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName('') } }}
                            className="text-sm bg-transparent outline-none w-36 text-foreground placeholder:text-muted-foreground"
                        />
                        {/* Couleurs */}
                        <div className="flex items-center gap-1">
                            {FOLDER_COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setNewFolderColor(c)}
                                    className={cn('w-3.5 h-3.5 rounded-full transition-transform', newFolderColor === c && 'scale-125 ring-2 ring-offset-1 ring-offset-card')}
                                    style={{ backgroundColor: c, '--tw-ring-color': c } as React.CSSProperties}
                                />
                            ))}
                        </div>
                        <button onClick={handleCreateFolder} className="text-primary hover:text-primary/80">
                            <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => { setShowNewFolder(false); setNewFolderName('') }} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowNewFolder(true)}
                        className="flex items-center gap-1.5 rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all"
                    >
                        <FolderPlus className="h-3.5 w-3.5" />
                        Nouveau dossier
                    </button>
                )}
            </div>

            {/* ── Contenu ── */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-primary" />
                    </div>
                    {search ? (
                        <>
                            <h2 className="text-xl font-bold font-serif">Aucun résultat pour "{search}"</h2>
                            <p className="text-muted-foreground text-sm">Essayez un autre terme de recherche.</p>
                        </>
                    ) : recipes.length === 0 ? (
                        <>
                            <h2 className="text-xl font-bold font-serif mb-1">Aucune recette pour l'instant</h2>
                            <p className="text-muted-foreground text-sm max-w-sm">
                                Créez votre première recette — à l'écrit, en photos, ou dictée à l'oral.
                            </p>
                            <Button asChild size="lg" className="mt-2">
                                <Link href="/dashboard/recipes/new">
                                    <Plus className="h-4 w-4 mr-2" />Créer une recette
                                </Link>
                            </Button>
                        </>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold font-serif">Ce dossier est vide</h2>
                            <p className="text-muted-foreground text-sm">Déplacez des recettes ici via le menu "···" sur chaque carte.</p>
                        </>
                    )}
                </div>
            ) : view === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filtered.map(recipe => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            folder={recipe.folder_id ? (folderMap[recipe.folder_id] ?? null) : null}
                            folders={folders}
                            onDelete={setDeletingId}
                            onMove={handleMove}
                        />
                    ))}
                </div>
            ) : (
                <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
                    {/* Header liste */}
                    <div className="hidden md:flex items-center gap-4 px-4 py-2.5 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <div className="w-12 shrink-0" />
                        <div className="flex-1">Recette</div>
                        <div className="w-28 shrink-0">Catégorie</div>
                        <div className="w-32 shrink-0 hidden lg:block">Dossier</div>
                        <div className="w-20 shrink-0 hidden sm:block">Durée</div>
                        <div className="w-32 shrink-0 hidden xl:block">Tags</div>
                        <div className="w-20 shrink-0" />
                    </div>
                    {filtered.map(recipe => (
                        <RecipeRow
                            key={recipe.id}
                            recipe={recipe}
                            folder={recipe.folder_id ? (folderMap[recipe.folder_id] ?? null) : null}
                            folders={folders}
                            onDelete={setDeletingId}
                            onMove={handleMove}
                        />
                    ))}
                </div>
            )}

            {/* ── Import dialog ── */}
            <ImportRecipesDialog
                open={showImport}
                onOpenChange={setShowImport}
                orgId={orgId}
            />

            {/* ── Confirm suppression recette ── */}
            <ConfirmDialog
                open={!!deletingId}
                onOpenChange={open => { if (!open) setDeletingId(null) }}
                title="Supprimer cette recette ?"
                description="Cette recette sera définitivement supprimée. Les fichiers audio et photos associés seront conservés dans le stockage."
                confirmLabel={deleting ? 'Suppression...' : 'Supprimer'}
                cancelLabel="Annuler"
                variant="destructive"
                onConfirm={handleDelete}
            />

            {/* ── Confirm suppression dossier ── */}
            <ConfirmDialog
                open={!!deletingFolderId}
                onOpenChange={open => { if (!open) setDeletingFolderId(null) }}
                title="Supprimer ce dossier ?"
                description="Le dossier sera supprimé. Les recettes qu'il contient ne seront pas supprimées — elles seront simplement déplacées dans « Sans dossier »."
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                variant="destructive"
                onConfirm={handleDeleteFolder}
            />
        </>
    )
}
