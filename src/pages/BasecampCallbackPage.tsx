import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { conectarBasecampUnaVez } from "@/lib/api/basecamp"
import {
  limpiarStateBasecamp,
  redirectUriBasecamp,
  validarStateBasecamp,
} from "@/lib/basecamp-oauth"
import { useAuthStore } from "@/store/auth-store"

function errorDesdeUrl(): string | null {
  const query = new URLSearchParams(window.location.search)
  return query.get("error_description") || query.get("error")
}

export function BasecampCallbackPage() {
  const navigate = useNavigate()
  const loading = useAuthStore((state) => state.loading)
  const session = useAuthStore((state) => state.session)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) {
      return
    }

    const query = new URLSearchParams(window.location.search)
    const oauthError = errorDesdeUrl()
    if (oauthError) {
      limpiarStateBasecamp()
      setError(oauthError)
      return
    }

    const code = query.get("code")
    if (!code) {
      limpiarStateBasecamp()
      setError("Basecamp no devolvió el código de autorización.")
      return
    }

    if (!validarStateBasecamp(query.get("state"))) {
      limpiarStateBasecamp()
      setError("La autorización de Basecamp no es válida. Volvé a conectar desde Mi cuenta.")
      return
    }

    if (!session) {
      limpiarStateBasecamp()
      setError("Iniciá sesión en prometIO antes de conectar Basecamp.")
      return
    }

    let cancelled = false
    void conectarBasecampUnaVez(code, redirectUriBasecamp())
      .then(() => {
        if (cancelled) {
          return
        }
        limpiarStateBasecamp()
        navigate("/cuenta", { replace: true, state: { basecampOk: true } })
      })
      .catch((exc: unknown) => {
        if (cancelled) {
          return
        }
        limpiarStateBasecamp()
        navigate("/cuenta", {
          replace: true,
          state: {
            basecampError:
              exc instanceof Error
                ? exc.message
                : "Basecamp rechazó la conexión. Pedí de nuevo el consentimiento.",
          },
        })
      })

    return () => {
      cancelled = true
    }
  }, [loading, navigate, session])

  if (error) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
        <p className="max-w-sm text-center text-sm text-destructive" role="alert">
          {error}
        </p>
        <Button asChild variant="outline">
          <Link to="/cuenta">Volver a Mi cuenta</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-2 bg-background">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Conectando Basecamp…</p>
    </div>
  )
}
