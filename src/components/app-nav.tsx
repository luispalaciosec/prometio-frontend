import { NavLink, useLocation } from "react-router-dom"
import {
  Activity,
  Bell,
  Building2,
  Cake,
  Calendar,
  CalendarClock,
  CircleUser,
  Columns3,
  History,
  House,
  Inbox,
  LayoutDashboard,
  LayoutList,
  FileText,
  Receipt,
  ScrollText,
  Search,
  Tv,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react"

import { ConfigSidebar } from "@/components/config-sidebar"
import { PrometioLogo } from "@/components/prometio-logo"
import { ModeToggle } from "@/components/mode-toggle"
import { SidebarSection } from "@/components/sidebar-section"
import { sidebarNavClass } from "@/components/sidebar-nav"
import { Button } from "@/components/ui/button"
import { puedeVerModuloMarketing, puedeVerModuloVentas } from "@/lib/pipeline-acceso"
import { useAuthStore } from "@/store/auth-store"

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean; adminOnly?: boolean }

const crmNav: NavItem[] = [
  { to: "/resumen", label: "Resumen", icon: LayoutList },
  { to: "/contactos", label: "Contactos", icon: Users },
  { to: "/empresas", label: "Empresas", icon: Building2 },
  { to: "/bandeja", label: "Bandeja", icon: Inbox },
  { to: "/cumpleanos", label: "Cumpleaños", icon: Cake },
]

const negociosNav: NavItem[] = [
  { to: "/pipeline", label: "Pipeline", icon: Columns3 },
  { to: "/cotizaciones", label: "Cotizaciones", icon: FileText },
  { to: "/facturas", label: "Facturas", icon: Receipt },
  { to: "/alertas", label: "Alertas", icon: Bell },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/proveedores", label: "Proveedores", icon: Truck },
]

const herramientasNav: NavItem[] = [
  { to: "/seo", label: "SEO", icon: Search },
  { to: "/tv", label: "Modo TV", icon: Tv },
]

function itemActive(pathname: string, item: NavItem) {
  if (item.end) {
    return pathname === item.to
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export function AppNav({ onNavigate }: { onNavigate?: () => void }) {
  const perfil = useAuthStore((state) => state.perfil)
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const location = useLocation()
  const isAdmin = perfil?.equipo === "administrativo"
  const isVentas = perfil ? puedeVerModuloVentas(perfil) : false
  const isMarketing = perfil ? puedeVerModuloMarketing(perfil) : false
  const isProveedores = perfil ? perfil.equipo === "proveedores" : false
  const crmActivo = crmNav.some((item) => itemActive(location.pathname, item))
  const negociosVisible = negociosNav.filter((item) => {
    if (item.to === "/proveedores") {
      return isAdmin
    }
    return true
  })
  const negociosActivo = negociosNav.some((item) => itemActive(location.pathname, item))
  const agendaActivo = location.pathname.startsWith("/agenda")
  const saludActivo =
    location.pathname.startsWith("/salud") || location.pathname.startsWith("/auditoria")
  const herramientasActivo = herramientasNav.some((item) => itemActive(location.pathname, item))

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <NavLink to="/" className="shrink-0 px-1" onClick={onNavigate}>
        <PrometioLogo onDark className="h-7 w-auto" />
      </NavLink>
      <nav className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isVentas ? (
          <>
            <NavLink
              to="/"
              end
              onClick={onNavigate}
              className={({ isActive }) => sidebarNavClass(isActive)}
            >
              <House className="size-[18px] shrink-0 opacity-80" aria-hidden />
              Bienvenida
            </NavLink>
            <SidebarSection title="CRM" active={crmActivo}>
              {crmNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) => sidebarNavClass(isActive)}
                >
                  <item.icon className="size-[18px] shrink-0 opacity-80" aria-hidden />
                  {item.label}
                </NavLink>
              ))}
            </SidebarSection>
            <SidebarSection title="Negocios" active={negociosActivo}>
              {negociosVisible.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) => sidebarNavClass(isActive)}
                >
                  <item.icon className="size-[18px] shrink-0 opacity-80" aria-hidden />
                  {item.label}
                </NavLink>
              ))}
            </SidebarSection>
            <SidebarSection title="Agenda" active={agendaActivo}>
              <NavLink
                to="/agenda/actividades"
                onClick={onNavigate}
                className={({ isActive }) => sidebarNavClass(isActive)}
              >
                <CalendarClock className="size-[18px] shrink-0 opacity-80" aria-hidden />
                Actividades
              </NavLink>
              <NavLink
                to="/agenda/calendario"
                onClick={onNavigate}
                className={({ isActive }) => sidebarNavClass(isActive)}
              >
                <Calendar className="size-[18px] shrink-0 opacity-80" aria-hidden />
                Calendario
              </NavLink>
              <NavLink
                to="/agenda/timeline"
                onClick={onNavigate}
                className={({ isActive }) => sidebarNavClass(isActive)}
              >
                <History className="size-[18px] shrink-0 opacity-80" aria-hidden />
                Timeline
              </NavLink>
            </SidebarSection>
          </>
        ) : null}
        {isProveedores ? (
          <NavLink
            to="/proveedores"
            onClick={onNavigate}
            className={({ isActive }) => sidebarNavClass(isActive)}
          >
            <Truck className="size-[18px] shrink-0 opacity-80" aria-hidden />
            Proveedores
          </NavLink>
        ) : null}
        {isMarketing ? (
          <SidebarSection title="Herramientas" active={herramientasActivo}>
            {herramientasNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) => sidebarNavClass(isActive)}
              >
                <item.icon className="size-[18px] shrink-0 opacity-80" aria-hidden />
                {item.label}
              </NavLink>
            ))}
          </SidebarSection>
        ) : null}
        {isAdmin ? (
          <>
            <SidebarSection title="Salud del sistema" active={saludActivo}>
              <NavLink
                to="/salud"
                onClick={onNavigate}
                className={({ isActive }) => sidebarNavClass(isActive)}
              >
                <Activity className="size-[18px] shrink-0 opacity-80" aria-hidden />
                Servicios
              </NavLink>
              <NavLink
                to="/auditoria"
                onClick={onNavigate}
                className={({ isActive }) => sidebarNavClass(isActive)}
              >
                <ScrollText className="size-[18px] shrink-0 opacity-80" aria-hidden />
                Auditoría
              </NavLink>
            </SidebarSection>
            <ConfigSidebar onNavigate={onNavigate} />
          </>
        ) : null}
        {!isVentas && !isAdmin && !isMarketing && !isProveedores ? (
          <p className="px-2 text-kicker text-sidebar-foreground/60">
            Este perfil no tiene módulos asignados.
          </p>
        ) : null}
      </nav>
      <div className="mt-auto shrink-0 space-y-2 border-t border-sidebar-border pt-4">
        <NavLink to="/cuenta" onClick={onNavigate} className={({ isActive }) => sidebarNavClass(isActive)}>
          <CircleUser className="size-[18px] shrink-0 opacity-80" aria-hidden />
          Mi cuenta
        </NavLink>
        <p className="truncate px-2 text-micro text-sidebar-foreground/60">
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
          <ModeToggle
            menuSide="top"
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          />
        </div>
      </div>
    </div>
  )
}
