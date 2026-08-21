import { NavLink, Outlet, useLocation } from "react-router-dom"

import { ConfigSidebar } from "@/components/config-sidebar"
import { PrometioLogo } from "@/components/prometio-logo"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { puedeVerModuloVentas } from "@/lib/pipeline-acceso"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"

const ventasNav = [
  { to: "/pipeline", label: "Pipeline" },
  { to: "/bandeja", label: "Bandeja" },
  { to: "/empresas", label: "Empresas" },
  { to: "/alertas", label: "Alertas" },
  { to: "/dashboard", label: "Dashboard" },
]

export function AppShell() {
  const perfil = useAuthStore((state) => state.perfil)
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const location = useLocation()
  const isAdmin = perfil?.equipo === "administrativo"
  const isVentas = perfil ? puedeVerModuloVentas(perfil) : false
  const isPipeline = location.pathname === "/pipeline"
  const isBandeja = location.pathname.startsWith("/bandeja")

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 text-sidebar-foreground">
        {/* subida real pendiente — por ahora asset fijo */}
        <NavLink to="/" className="px-1">
          <PrometioLogo onDark className="h-7 w-auto" />
        </NavLink>
        <nav className="mt-6 flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {isVentas
            ? ventasNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-2 py-1.5 text-sm transition-colors duration-150",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--highlight)]"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))
            : null}
          {isAdmin ? <ConfigSidebar /> : null}
          {!isVentas && !isAdmin ? (
            <p className="px-2 text-sm text-sidebar-foreground/60">
              Este perfil no tiene módulos de ventas ni configuración.
            </p>
          ) : null}
        </nav>
        <div className="mt-auto space-y-2 border-t border-sidebar-border pt-4">
          <p className="truncate px-2 text-xs text-sidebar-foreground/60">
            {perfil?.email ?? user?.email}
          </p>
          <div className="flex items-center justify-between px-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={() => void signOut()}
            >
              Cerrar sesión
            </Button>
            <ModeToggle className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
          </div>
        </div>
      </aside>
      <main
        className={cn(
          "min-h-0 min-w-0 flex-1",
          isBandeja ? "overflow-hidden" : "overflow-auto",
        )}
      >
        <div
          className={cn(
            isBandeja
              ? "flex h-full min-h-0 flex-col"
              : isPipeline
                ? "px-6 py-6"
                : "mx-auto max-w-5xl px-8 py-8",
          )}
        >
          <Outlet />
        </div>
      </main>
    </div>
  )
}
