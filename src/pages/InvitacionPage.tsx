import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import type { Session } from "@supabase/supabase-js"

import { PrometioLogo } from "@/components/prometio-logo"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { hashAuthParams } from "@/lib/auth-invite"
import { isSupabaseConfigured, supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/auth-store"

export function InvitacionPage() {
  const navigate = useNavigate()
  const session = useAuthStore((state) => state.session)
  const [password, setPassword] = useState("")
  const [confirmacion, setConfirmacion] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [esperandoSesion, setEsperandoSesion] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el entorno.")
      setEsperandoSesion(false)
      return
    }

    const hash = hashAuthParams()
    const hashError = hash.get("error_description") || hash.get("error")
    if (hashError) {
      setError(hashError)
      setEsperandoSesion(false)
      return
    }

    let done = false
    const timeout = window.setTimeout(() => {
      if (!done) {
        setError(
          "El enlace de invitación expiró o ya fue usado. Pedí una nueva invitación al administrador.",
        )
        setEsperandoSesion(false)
      }
    }, 15000)

    function listo(next: Session | null) {
      if (done || !next) {
        return
      }
      done = true
      window.clearTimeout(timeout)
      useAuthStore.getState().setSession(next)
      setEsperandoSesion(false)
    }

    void supabase.auth.getSession().then(({ data: { session: current } }) => {
      listo(current)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      listo(next)
    })

    return () => {
      done = true
      window.clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!esperandoSesion && !session && !error) {
      setError("Enlace inválido o expirado. Pedí una nueva invitación.")
    }
  }, [esperandoSesion, session, error])

  async function crearContrasena(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!session) {
      setError("La sesión de invitación ya no está activa. Pedí un nuevo enlace.")
      return
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.")
      return
    }
    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden.")
      return
    }

    setSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSubmitting(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    navigate("/", { replace: true })
  }

  const email = session?.user.email

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <Card className="w-full max-w-sm border-0 bg-transparent shadow-none ring-0">
        <CardHeader className="gap-2 px-0">
          <PrometioLogo className="mb-1" />
          <CardTitle className="font-heading text-2xl tracking-tight">
            Crear tu contraseña
          </CardTitle>
          <CardDescription>
            {email
              ? `Activá tu acceso a prometIO con ${email}.`
              : "Activá tu acceso a prometIO con la contraseña que vas a usar de ahora en adelante."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {esperandoSesion ? (
            <div className="flex flex-col items-center gap-2 py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Validando invitación…</p>
            </div>
          ) : error && !session ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
              <Button asChild variant="outline" className="h-9 w-full">
                <Link to="/login">Ir al login</Link>
              </Button>
            </div>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={(event) => void crearContrasena(event)}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="invite-password">Contraseña</Label>
                <Input
                  id="invite-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-9"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="invite-confirm">Confirmar contraseña</Label>
                <Input
                  id="invite-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmacion}
                  onChange={(event) => setConfirmacion(event.target.value)}
                  className="h-9"
                />
              </div>
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="h-9 w-full" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" /> : "Activar cuenta"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
