import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import type { Session } from "@supabase/supabase-js"

import { Button } from "@/components/ui/button"
import { conectarCalendar } from "@/lib/api/google-calendar"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/auth-store"

function errorDesdeUrl(): string | null {
  const query = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  return (
    query.get("error_description") ||
    query.get("error") ||
    hash.get("error_description") ||
    hash.get("error")
  )
}

function destinoSeguro(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) {
    return "/"
  }
  return raw
}

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [volverA, setVolverA] = useState("/login")
  const [mensaje, setMensaje] = useState("Completando acceso…")

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const calendar = query.get("calendar") === "1"
    const next = destinoSeguro(query.get("next"))

    const oauthError = errorDesdeUrl()
    if (oauthError) {
      setError(oauthError)
      setVolverA(calendar ? "/cuenta" : "/login")
      return
    }

    if (calendar) {
      setMensaje("Conectando Google Calendar…")
    }

    let done = false
    let completing = false
    const timeout = window.setTimeout(() => {
      if (!done) {
        setError(calendar ? "No se pudo completar la conexión con Calendar." : "No se pudo completar el acceso con Google.")
        setVolverA(calendar ? "/cuenta" : "/login")
      }
    }, 15000)

    async function completar(session: Session) {
      if (done || completing) {
        return
      }
      completing = true
      useAuthStore.getState().setSession(session)

      if (calendar) {
        const refresh = session.provider_refresh_token
        if (!refresh) {
          done = true
          window.clearTimeout(timeout)
          navigate("/cuenta", {
            replace: true,
            state: {
              calendarError:
                "Google no devolvió el permiso de Calendar. Volvé a conectar y aceptá el consentimiento.",
            },
          })
          return
        }
        try {
          await conectarCalendar(refresh)
        } catch (exc) {
          done = true
          window.clearTimeout(timeout)
          navigate("/cuenta", {
            replace: true,
            state: {
              calendarError:
                exc instanceof Error
                  ? exc.message
                  : "Google rechazó el permiso. Pedí de nuevo el consentimiento.",
            },
          })
          return
        }
        done = true
        window.clearTimeout(timeout)
        navigate("/cuenta", { replace: true, state: { calendarOk: true } })
        return
      }

      done = true
      window.clearTimeout(timeout)
      navigate(next, { replace: true })
    }

    const pendingCode = query.has("code")
    if (!pendingCode) {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          void completar(session)
        }
      })
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        return
      }
      if (
        calendar &&
        pendingCode &&
        event === "INITIAL_SESSION" &&
        !session.provider_refresh_token
      ) {
        return
      }
      void completar(session)
    })

    return () => {
      window.clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [navigate])

  if (error) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
        <p className="max-w-sm text-center text-sm text-destructive" role="alert">
          {error}
        </p>
        <Button asChild variant="outline">
          <Link to={volverA}>{volverA === "/cuenta" ? "Volver a Mi cuenta" : "Volver al login"}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-2 bg-background">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{mensaje}</p>
    </div>
  )
}
