import { useEffect, type ReactNode } from "react"

import { fetchPerfil } from "@/lib/perfil-api"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/auth-store"

export function AuthProvider({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((state) => state.setSession)
  const setPerfil = useAuthStore((state) => state.setPerfil)
  const setLoading = useAuthStore((state) => state.setLoading)

  useEffect(() => {
    let cancelled = false

    async function hydrate(userId: string | undefined) {
      if (cancelled) {
        return
      }
      if (!userId) {
        const pendingCode = new URLSearchParams(window.location.search).has("code")
        if (pendingCode) {
          return
        }
        setPerfil(null)
        setLoading(false)
        return
      }
      const perfil = await fetchPerfil(userId)
      if (cancelled) {
        return
      }
      setPerfil(perfil)
      setLoading(false)
    }

    // Solo onAuthStateChange: espera INITIAL_SESSION (incluye el canje PKCE del ?code=).
    // getSession() en paralelo marcaba loading=false con session=null y ProtectedRoute
    // mandaba a /login, borrando el code.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      void hydrate(session?.user.id)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [setLoading, setPerfil, setSession])

  return children
}
