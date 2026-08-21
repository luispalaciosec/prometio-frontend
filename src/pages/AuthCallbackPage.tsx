import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

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

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const oauthError = errorDesdeUrl()
    if (oauthError) {
      setError(oauthError)
      return
    }

    let done = false
    const timeout = window.setTimeout(() => {
      if (!done) {
        setError("No se pudo completar el acceso con Google.")
      }
    }, 15000)

    function entrar() {
      if (done) {
        return
      }
      done = true
      window.clearTimeout(timeout)
      navigate("/", { replace: true })
    }

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        entrar()
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        entrar()
      }
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
          <Link to="/login">Volver al login</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-2 bg-background">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Completando acceso…</p>
    </div>
  )
}
