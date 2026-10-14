import { TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Pantalla cuando un error de render tumba la app: en vez de quedar en blanco, ofrece recargar. */
export function ErrorFallback() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <TriangleAlert className="size-5" strokeWidth={1.75} aria-hidden />
      </span>
      <p className="mt-4 text-section">Algo se rompió en esta pantalla</p>
      <p className="mt-1 max-w-[320px] text-kicker">
        El error quedó registrado. Recargá la página; si se repite, avisá al equipo.
      </p>
      <Button type="button" className="mt-4" onClick={() => window.location.reload()}>
        Recargar
      </Button>
    </div>
  )
}
