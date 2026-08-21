import { useEffect, type ReactNode } from "react"

import { fetchPerfil } from "@/lib/perfil-api"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/auth-store"

export function AuthProvider({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((state) => state.setSession)
  const setPerfil = useAuthStore((state) => state.setPerfil)
  const setLoading = useAuthStore((state) => state.setLoading)

  useEffect(() => {
    async function hydrate(userId: string | undefined) {
      if (!userId) {
        setPerfil(null)
        setLoading(false)
        return
      }
      const perfil = await fetchPerfil(userId)
      setPerfil(perfil)
      setLoading(false)
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      void hydrate(session?.user.id)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      void hydrate(session?.user.id)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setLoading, setPerfil, setSession])

  return children
}
