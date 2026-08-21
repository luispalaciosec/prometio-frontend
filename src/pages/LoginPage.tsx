import { useState, type FormEvent } from "react"
import { useSearchParams } from "react-router-dom"
import { Loader2 } from "lucide-react"

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
import { Separator } from "@/components/ui/separator"
import { isSupabaseConfigured, supabase } from "@/lib/supabase"

function mapAuthError(message: string): string {
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos."
  }
  if (message.toLowerCase().includes("email not confirmed")) {
    return "Confirma tu correo antes de iniciar sesión."
  }
  return message
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function LoginPage() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(
    searchParams.get("error_description") || searchParams.get("error"),
  )
  const [submitting, setSubmitting] = useState<"password" | "google" | null>(null)

  async function handlePasswordSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!isSupabaseConfigured) {
      setError("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el entorno.")
      return
    }

    setSubmitting("password")
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setSubmitting(null)

    if (signInError) {
      setError(mapAuthError(signInError.message))
    }
  }

  async function handleGoogleSignIn() {
    setError(null)

    if (!isSupabaseConfigured) {
      setError("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el entorno.")
      return
    }

    setSubmitting("google")
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setSubmitting(null)

    if (oauthError) {
      setError(mapAuthError(oauthError.message))
    }
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <Card className="w-full max-w-sm border-0 bg-transparent shadow-none ring-0">
        <CardHeader className="gap-2 px-0">
          <PrometioLogo className="mb-1" />
          <CardTitle className="font-heading text-2xl tracking-tight">
            Iniciar sesión
          </CardTitle>
          <CardDescription>
            Accede con tu correo de Geeks o con Google.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <form className="flex flex-col gap-4" onSubmit={handlePasswordSignIn}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-9"
                placeholder="peter.m@example.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-9"
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="h-9 w-full" disabled={submitting !== null}>
              {submitting === "password" ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">o</span>
            <Separator className="flex-1" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-9 w-full"
            onClick={handleGoogleSignIn}
            disabled={submitting !== null}
          >
            {submitting === "google" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continuar con Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
