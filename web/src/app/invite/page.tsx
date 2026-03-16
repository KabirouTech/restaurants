'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useUser, SignIn } from '@clerk/nextjs'
import { Loader2, CheckCircle2, XCircle, Users, ArrowRight, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { acceptInvitationAction } from '@/actions/invite'

type State =
  | { status: 'loading' }
  | { status: 'needs_auth' }
  | { status: 'accepting' }
  | { status: 'success'; role: string }
  | { status: 'error'; message: string; upgradeRequired?: boolean }

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-stone-100">
        <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
      </div>
    }>
      <InvitePageContent />
    </Suspense>
  )
}

function InvitePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const token = searchParams.get('token')

  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    if (!isLoaded) return

    if (!token) {
      setState({ status: 'error', message: 'Lien d\'invitation invalide ou manquant.' })
      return
    }

    if (!user) {
      setState({ status: 'needs_auth' })
      return
    }

    // User is authenticated → accept invitation
    async function accept() {
      setState({ status: 'accepting' })
      const result = await acceptInvitationAction(token!, user!.id)

      if (result.success) {
        setState({ status: 'success', role: result.role || 'member' })
        setTimeout(() => router.push('/dashboard'), 2500)
      } else {
        setState({
          status: 'error',
          message: result.error || 'Erreur lors de l\'acceptation.',
          upgradeRequired: result.upgradeRequired,
        })
      }
    }

    accept()
  }, [isLoaded, user, token])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-stone-100 p-4">
      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header décoratif */}
        <div className="relative h-36 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-700 overflow-hidden">
          {/* Motif de points */}
          <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="2" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 blur-sm" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/10 blur-sm" />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="p-3 rounded-2xl bg-white/25 backdrop-blur-sm border border-white/30">
              <Users className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white drop-shadow">Invitation d'équipe</h1>
            <p className="text-sm text-orange-100">RestaurantOS</p>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-8">
          {/* LOADING initial */}
          {state.status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
              <p className="text-muted-foreground text-sm">Vérification de votre invitation…</p>
            </div>
          )}

          {/* NEEDS AUTH */}
          {state.status === 'needs_auth' && (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="p-4 rounded-full bg-amber-50 border border-amber-200">
                <LogIn className="h-8 w-8 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">Connexion requise</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Connectez-vous ou créez un compte pour accepter cette invitation et rejoindre l'équipe.
                </p>
              </div>
              <div className="w-full flex flex-col gap-3">
                <Button
                  className="w-full"
                  onClick={() => router.push(`/sign-in?redirect_url=${encodeURIComponent(`/invite?token=${token}`)}`)}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Se connecter
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/sign-up?redirect_url=${encodeURIComponent(`/invite?token=${token}`)}`)}
                >
                  Créer un compte
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ACCEPTING */}
          {state.status === 'accepting' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
              <div className="text-center">
                <p className="font-semibold text-foreground">Acceptation en cours…</p>
                <p className="text-sm text-muted-foreground mt-1">Nous configurons votre accès.</p>
              </div>
            </div>
          )}

          {/* SUCCESS */}
          {state.status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="p-4 rounded-full bg-green-50 border border-green-200">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">Invitation acceptée ! 🎉</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Vous avez rejoint l'équipe avec le rôle <strong>{state.role}</strong>.
                  <br />Redirection vers le tableau de bord…
                </p>
              </div>
              <Loader2 className="h-5 w-5 text-orange-500 animate-spin mt-2" />
            </div>
          )}

          {/* ERROR */}
          {state.status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="p-4 rounded-full bg-red-50 border border-red-200">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground mb-1">Invitation invalide</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{state.message}</p>
              </div>
              {state.upgradeRequired ? (
                <Button className="w-full" onClick={() => router.push('/dashboard/settings/subscription')}>
                  Voir les plans
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
                  Retour à l'accueil
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-muted-foreground">
        🍽️ RestaurantOS — Simplifiez la gestion de votre restaurant
      </p>
    </div>
  )
}
