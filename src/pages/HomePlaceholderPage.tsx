import { Link } from "react-router-dom"

import { PrometioLogo } from "@/components/prometio-logo"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth-store"

export function HomePlaceholderPage() {
  const perfil = useAuthStore((state) => state.perfil)
  const user = useAuthStore((state) => state.user)
  const isAdmin = perfil?.equipo === "administrativo"
  const isVentas = perfil?.equipo === "administrativo" || perfil?.equipo === "ventas"
  const isMarketing = perfil?.equipo === "administrativo" || perfil?.equipo === "marketing"

  return (
    <div className="max-w-lg space-y-4">
      <PrometioLogo />
      <h1 className="text-page">Sesión iniciada</h1>
      <p className="text-kicker">
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
        {isMarketing && !isAdmin ? (
          <Button asChild>
            <Link to="/seo">Ir a SEO</Link>
          </Button>
        ) : null}
      </div>
      {!isVentas && !isAdmin && !isMarketing ? (
        <p className="text-kicker">
          El pipeline es para <code>equipo = ventas</code> o <code>administrativo</code>.
          SEO es para marketing o administrativo. El Panel de Configuración es solo para
          administrativo.
        </p>
      ) : null}
    </div>
  )
}
