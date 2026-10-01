import { NavLink, Outlet } from "react-router-dom"

import { PageHeader } from "@/components/page-header"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"

function tabClass({ isActive }: { isActive: boolean }) {
  return cn(
    "rounded-full px-3 py-1.5 text-kicker transition-colors",
    isActive ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
  )
}

export function ProspeccionLinkedInLayout() {
  const isAdmin = useAuthStore((state) => state.perfil?.equipo === "administrativo")

  return (
    <>
      <PageHeader
        title="Prospección LinkedIn"
        description="Resultados de búsqueda en LinkedIn y gestión de leads. Los criterios definen qué perfiles trae Apify."
      />
      <nav
        aria-label="Sección Prospección LinkedIn"
        className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4"
      >
        <NavLink to="/prospeccion-linkedin" end className={tabClass}>
          Resultados
        </NavLink>
        {isAdmin ? (
          <NavLink to="/prospeccion-linkedin/configuracion" className={tabClass}>
            Configuración
          </NavLink>
        ) : null}
      </nav>
      <Outlet />
    </>
  )
}
