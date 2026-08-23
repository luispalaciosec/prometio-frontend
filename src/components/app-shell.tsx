import { NavLink, Outlet, useLocation } from "react-router-dom"
import {
  Activity,
  Bell,
  Building2,
  Cake,
  CalendarClock,
  Columns3,
  Inbox,
  LayoutDashboard,
  LayoutList,
  ScrollText,
  Users,
  type LucideIcon,
} from "lucide-react"

import { ConfigSidebar } from "@/components/config-sidebar"
import { PrometioLogo } from "@/components/prometio-logo"
import { ModeToggle } from "@/components/mode-toggle"
import { SidebarSection } from "@/components/sidebar-section"
import { sidebarNavClass } from "@/components/sidebar-nav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { puedeVerModuloVentas } from "@/lib/pipeline-acceso"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean }

const crmNav: NavItem[] = [
  { to: "/", label: "Resumen", icon: LayoutList, end: true },
  { to: "/contactos", label: "Contactos", icon: Users },
  { to: "/empresas", label: "Empresas", icon: Building2 },
  { to: "/bandeja", label: "Bandeja", icon: Inbox },
  { to: "/cumpleanos", label: "Cumpleaños", icon: Cake },
]

const negociosNav: NavItem[] = [
  { to: "/pipeline", label: "Pipeline", icon: Columns3 },
  { to: "/alertas", label: "Alertas", icon: Bell },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
]

function itemActive(pathname: string, item: NavItem) {
  if (item.end) {
    return pathname === item.to
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export function AppShell() {
  const perfil = useAuthStore((state) => state.perfil)
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const location = useLocation()
  const isAdmin = perfil?.equipo === "administrativo"
  const isVentas = perfil ? puedeVerModuloVentas(perfil) : false
  const isPipeline = location.pathname === "/pipeline"
  const isBandeja = location.pathname.startsWith("/bandeja")
  const crmActivo = crmNav.some((item) => itemActive(location.pathname, item))
  const negociosActivo = negociosNav.some((item) => itemActive(location.pathname, item))
  const saludActivo =
    location.pathname.startsWith("/salud") || location.pathname.startsWith("/auditoria")

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 text-sidebar-foreground">
        <NavLink to="/" className="px-1">
          <PrometioLogo onDark className="h-7 w-auto" />
        </NavLink>
        <nav className="mt-6 flex flex-1 flex-col overflow-y-auto">
          {isVentas ? (
            <>
              <SidebarSection title="CRM" active={crmActivo}>
                {crmNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => sidebarNavClass(isActive)}
                  >
                    <item.icon className="size-4 shrink-0 opacity-80" aria-hidden />
                    {item.label}
                  </NavLink>
                ))}
              </SidebarSection>
              <SidebarSection title="Negocios" active={negociosActivo}>
                {negociosNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => sidebarNavClass(isActive)}
                  >
                    <item.icon className="size-4 shrink-0 opacity-80" aria-hidden />
                    {item.label}
                  </NavLink>
                ))}
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-sidebar-foreground/40">
                  <CalendarClock className="size-4 shrink-0 opacity-80" aria-hidden />
                  <span className="min-w-0 flex-1">Actividades</span>
                  <Badge variant="secondary" className="h-4 px-1.5 text-[0.6rem]">
                    Próximamente
                  </Badge>
                </div>
              </SidebarSection>
            </>
          ) : null}
          {isAdmin ? (
            <>
              <SidebarSection title="Salud del sistema" active={saludActivo}>
                <NavLink
                  to="/salud"
                  className={({ isActive }) => sidebarNavClass(isActive)}
                >
                  <Activity className="size-4 shrink-0 opacity-80" aria-hidden />
                  Servicios
                </NavLink>
                <NavLink
                  to="/auditoria"
                  className={({ isActive }) => sidebarNavClass(isActive)}
                >
                  <ScrollText className="size-4 shrink-0 opacity-80" aria-hidden />
                  Auditoría
                </NavLink>
              </SidebarSection>
              <ConfigSidebar />
            </>
          ) : null}
          {!isVentas && !isAdmin ? (
            <p className="px-2 text-kicker text-sidebar-foreground/60">
              Este perfil no tiene módulos de ventas ni configuración.
            </p>
          ) : null}
        </nav>
        <div className="mt-auto space-y-2 border-t border-sidebar-border pt-4">
          <p className="truncate px-2 text-kicker text-sidebar-foreground/60">
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
