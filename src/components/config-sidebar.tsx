import { useEffect, useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { ChevronRight, Settings } from "lucide-react"

import { CONFIG_NAV_GROUPS } from "@/lib/config-nav"
import { sidebarNavClass } from "@/components/sidebar-nav"
import { cn } from "@/lib/utils"

export function ConfigSidebar() {
  const location = useLocation()
  const inConfig =
    location.pathname.startsWith("/configuracion") || location.pathname.startsWith("/seo")
  const [open, setOpen] = useState(inConfig)

  useEffect(() => {
    setOpen(inConfig)
  }, [inConfig])

  return (
    <div className="mt-3 border-t border-sidebar-border pt-3">
      <div className="flex items-center gap-0.5">
        <NavLink
          to="/configuracion"
          end
          className={({ isActive }) => cn("min-w-0 flex-1", sidebarNavClass(isActive))}
        >
          <Settings className="size-4 shrink-0 opacity-80" aria-hidden />
          Configuración
        </NavLink>
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Ocultar secciones" : "Mostrar secciones"}
          className="rounded-md p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => setOpen((prev) => !prev)}
        >
          <ChevronRight className={cn("size-4 transition-transform duration-150", open && "rotate-90")} />
        </button>
      </div>
      {open
        ? CONFIG_NAV_GROUPS.map((group) => (
            <div key={group.title} className="mt-2">
              <p className="px-2 pb-1 text-micro uppercase tracking-[0.04em] text-sidebar-foreground/45">
                {group.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => sidebarNavClass(isActive, true)}
                  >
                    <item.icon className="size-4 shrink-0 opacity-80" aria-hidden />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))
        : null}
    </div>
  )
}
