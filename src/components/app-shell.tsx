import { useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { Menu, X } from "lucide-react"

import { AppNav } from "@/components/app-nav"
import { PrometioLogo } from "@/components/prometio-logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AppShell() {
  const location = useLocation()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const isPipeline = location.pathname === "/pipeline"
  const isBandeja = location.pathname.startsWith("/bandeja")

  useEffect(() => {
    setMenuAbierto(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuAbierto) {
      return
    }
    const anterior = document.body.style.overflow
    document.body.style.overflow = "hidden"
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuAbierto(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = anterior
      window.removeEventListener("keydown", onKey)
    }
  }, [menuAbierto])

  return (
    <div className="flex min-h-svh flex-col bg-background md:h-svh md:flex-row md:overflow-hidden">
      <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-3 pt-[env(safe-area-inset-top)] md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Abrir menú"
          onClick={() => setMenuAbierto(true)}
        >
          <Menu />
        </Button>
        <PrometioLogo className="h-6 w-auto" />
      </header>

      <aside className="sticky top-0 hidden h-svh w-56 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar px-3 py-5 text-sidebar-foreground md:flex">
        <AppNav />
      </aside>

      <div
        className={cn("md:hidden", menuAbierto ? "fixed inset-0 z-50" : "pointer-events-none")}
      >
        <button
          type="button"
          aria-label="Cerrar menú"
          className={cn(
            "absolute inset-0 bg-overlay/40 transition-opacity duration-200",
            menuAbierto ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMenuAbierto(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex min-h-0 w-[min(18rem,88vw)] flex-col overflow-hidden bg-sidebar px-3 py-5 pt-[max(1.25rem,env(safe-area-inset-top))] text-sidebar-foreground shadow-modal transition-transform duration-200",
            menuAbierto ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Cerrar menú"
            className="absolute top-3 right-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => setMenuAbierto(false)}
          >
            <X />
          </Button>
          <AppNav onNavigate={() => setMenuAbierto(false)} />
        </aside>
      </div>

      <main
        className={cn(
          "min-h-0 min-w-0 flex-1",
          isBandeja ? "flex flex-col overflow-hidden" : "overflow-auto",
        )}
      >
        <div
          className={cn(
            isBandeja
              ? "flex min-h-0 flex-1 flex-col"
              : isPipeline
                ? "px-4 py-4 md:px-6 md:py-6"
                : "mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8",
          )}
        >
          <Outlet />
        </div>
      </main>
    </div>
  )
}
