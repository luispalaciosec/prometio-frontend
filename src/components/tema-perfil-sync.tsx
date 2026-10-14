import { useEffect } from "react"

import { useTheme } from "@/components/theme-provider"
import { useAuthStore } from "@/store/auth-store"

/**
 * El tema vive en `perfil.tema_preferido` para que siga al usuario entre equipos. El navegador guarda una copia
 * (`prometio-theme`) para pintar antes del login; si en este navegador todavía no hay elección, manda el perfil.
 */
export function TemaPerfilSync() {
  const perfil = useAuthStore((state) => state.perfil)
  const { setTheme } = useTheme()

  useEffect(() => {
    if (!perfil?.tema_preferido) {
      return
    }
    let guardado: string | null = null
    try {
      guardado = localStorage.getItem("prometio-theme")
    } catch {
      /* sin storage: se usa el del perfil */
    }
    // Una vez elegido en este navegador, manda la elección explícita del toggle (que también se guarda en el perfil).
    if (!guardado) {
      setTheme(perfil.tema_preferido)
    }
  }, [perfil?.tema_preferido, setTheme])

  return null
}
