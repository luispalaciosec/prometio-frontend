import { Button } from "@/components/ui/button"
import {
  accionesVisibles,
  type AccionCotizacion,
} from "@/lib/cotizacion-transiciones"
import type { CotizacionEstado } from "@/types/cotizacion"
import type { Perfil } from "@/types/perfil"

const LABELS: Record<AccionCotizacion, string> = {
  enviar: "Enviar",
  aprobar_preparacion: "Aprobar",
  rechazar_preparacion: "Rechazar",
  marcar_aprobada: "Marcar aprobada",
  marcar_rechazada: "Marcar rechazada",
  marcar_vencida: "Marcar vencida",
}

export function CotizacionTransiciones({
  perfil,
  estado,
  ejecutivoId,
  disabled,
  onAccion,
}: {
  perfil: Perfil
  estado: CotizacionEstado
  ejecutivoId: string
  disabled?: boolean
  onAccion: (accion: AccionCotizacion) => void
}) {
  const acciones = accionesVisibles(perfil, estado, ejecutivoId)
  if (acciones.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {acciones.map((accion) => (
        <Button
          key={accion}
          type="button"
          size="sm"
          variant={accion === "rechazar_preparacion" || accion === "marcar_rechazada" ? "outline" : "default"}
          disabled={disabled}
          onClick={() => onAccion(accion)}
        >
          {LABELS[accion]}
        </Button>
      ))}
    </div>
  )
}
