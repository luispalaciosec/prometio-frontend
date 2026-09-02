import { useEffect, useRef, useState } from "react"
import { Moon, Sun } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"

export function ModeToggle({
  className,
  menuSide = "bottom",
}: {
  className?: string
  /** En sidebar el trigger queda al fondo; abrir hacia arriba evita que el menú quede fuera del viewport. */
  menuSide?: "top" | "bottom"
}) {
  const { setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }
    window.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  function pickTheme(theme: "light" | "dark" | "system") {
    setTheme(theme)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Cambiar tema"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative", className)}
      >
        <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      </button>
      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute z-50 min-w-32 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10",
            menuSide === "top" ? "right-0 bottom-full mb-1" : "right-0 top-full mt-1",
          )}
        >
          {(
            [
              ["light", "Claro"],
              ["dark", "Oscuro"],
              ["system", "Sistema"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="menuitem"
              className="flex w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => pickTheme(value)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
