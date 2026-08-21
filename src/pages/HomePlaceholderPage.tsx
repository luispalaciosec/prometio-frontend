import { Link } from "react-router-dom"

import { PrometioLogo } from "@/components/prometio-logo"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth-store"

export function HomePlaceholderPage() {
  const perfil = useAuthStore((state) => state.perfil)
  const user = useAuthStore((state) => state.user)
  const isAdmin = perfil?.equipo === "administrativo"
  const isVentas = perfil?.equipo === "administrativo" || perfil?.equipo === "ventas"

  return (
    <div className="max-w-lg space-y-4">
      <PrometioLogo />
      <h1 className="font-heading text-2xl tracking-tight">Sesión iniciada</h1>
      <p className="text-sm text-muted-foreground">
        {perfil?.nombre_completo ?? user?.email}. Equipo:{" "}
        {perfil?.equipo ?? "sin perfil todavía"}.
      </p>
      <div className="flex flex-wrap gap-2">
        {isVentas ? (
          <Button asChild>
            <Link to="/pipeline">Ir al Pipeline</Link>
          </Button>
        ) : null}
        {isAdmin ? (
          <Button asChild variant={isVentas ? "outline" : "default"}>
            <Link to="/configuracion">Ir a Configuración</Link>
          </Button>
        ) : null}
      </div>
      {!isVentas && !isAdmin ? (
        <p className="text-sm text-muted-foreground">
          El pipeline es para <code>equipo = ventas</code> o <code>administrativo</code>.
          El Panel de Configuración es solo para administrativo.
        </p>
      ) : null}
    </div>
  )
}
