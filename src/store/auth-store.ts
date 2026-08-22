import type { Session, User } from "@supabase/supabase-js"
import { create } from "zustand"

import { supabase } from "@/lib/supabase"
import { clearOrganizationTheme } from "@/lib/theme"
import { useOrgStore } from "@/store/org-store"
import type { Perfil } from "@/types/perfil"

type AuthState = {
  session: Session | null
  user: User | null
  perfil: Perfil | null
  loading: boolean
  setSession: (session: Session | null) => void
  setPerfil: (perfil: Perfil | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  perfil: null,
  loading: true,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
    }),
  setPerfil: (perfil) => set({ perfil }),
  setLoading: (loading) => set({ loading }),
  signOut: async () => {
    await supabase.auth.signOut()
    useOrgStore.getState().setOrganizacion(null)
    clearOrganizationTheme()
    set({ session: null, user: null, perfil: null, loading: false })
  },
}))
