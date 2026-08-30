import { NavLink, Outlet } from "react-router-dom"

import { cn } from "@/lib/utils"

function tabClass({ isActive }: { isActive: boolean }) {
  return cn(
    "rounded-full px-3 py-1.5 text-kicker transition-colors",
    isActive
      ? "bg-foreground text-background"
      : "text-muted-foreground hover:text-foreground",
  )
}

export function ServiciosConfigLayout() {
  return (
    <>
      <nav
        aria-label="Secciones de servicios"
        className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4"
      >
        <NavLink to="/configuracion/servicios" end className={tabClass}>
          Servicios
        </NavLink>
        <NavLink to="/configuracion/servicios/categorias" className={tabClass}>
          Categorías
        </NavLink>
      </nav>
      <Outlet />
    </>
  )
}
