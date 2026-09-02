import { Navigate } from "react-router-dom"
import { Loader2 } from "lucide-react"
import type { ReactNode } from "react"

import { useAuthStore } from "@/store/auth-store"

/**
 * Solo exige sesión Supabase persistida (localStorage + refresh en background).
 * No valida perfil ni equipo — pensado para kiosco /tv con cuenta dedicada logueada una vez.
 */
function SessionRoute({ children }: { children: ReactNode }) {
  const session = useAuthStore((state) => state.session)
  const loading = useAuthStore((state) => state.loading)

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return children
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  return <SessionRoute>{children}</SessionRoute>
}

/** Alias explícito para /tv — misma regla que ProtectedRoute, sin AppShell ni guards de equipo. */
export function KioskRoute({ children }: { children: ReactNode }) {
  return <SessionRoute>{children}</SessionRoute>
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const session = useAuthStore((state) => state.session)
  const loading = useAuthStore((state) => state.loading)

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (session) {
    return <Navigate to="/" replace />
  }

  return children
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const perfil = useAuthStore((state) => state.perfil)
  const loading = useAuthStore((state) => state.loading)

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (perfil?.equipo !== "administrativo") {
    return <Navigate to="/" replace />
  }

  return children
}

export function VentasRoute({ children }: { children: ReactNode }) {
  const perfil = useAuthStore((state) => state.perfil)
  const loading = useAuthStore((state) => state.loading)

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (perfil?.equipo !== "administrativo" && perfil?.equipo !== "ventas") {
    return <Navigate to="/" replace />
  }

  return children
}

export function MarketingRoute({ children }: { children: ReactNode }) {
  const perfil = useAuthStore((state) => state.perfil)
  const loading = useAuthStore((state) => state.loading)

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (perfil?.equipo !== "administrativo" && perfil?.equipo !== "marketing") {
    return <Navigate to="/" replace />
  }

  return children
}

export function ProveedoresRoute({ children }: { children: ReactNode }) {
  const perfil = useAuthStore((state) => state.perfil)
  const loading = useAuthStore((state) => state.loading)

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (perfil?.equipo !== "administrativo" && perfil?.equipo !== "proveedores") {
    return <Navigate to="/" replace />
  }

  return children
}
