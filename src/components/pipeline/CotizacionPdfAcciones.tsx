import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { abrirPdfCotizacion } from "@/lib/api/cotizacion"
import { puedeVerDesgloseCotizacion } from "@/lib/pipeline-acceso"
import type { Perfil } from "@/types/perfil"

export function CotizacionPdfAcciones({
  cotizacionId,
  perfil,
  ejecutivoId,
  sinLineas = false,
}: {
  cotizacionId: string
  perfil: Perfil
  ejecutivoId: string
  sinLineas?: boolean
}) {
  const verInterno = puedeVerDesgloseCotizacion(perfil, ejecutivoId)
  const bloqueado = sinLineas
  const motivo = "Agregá al menos una línea antes de generar el PDF."

  async function abrir(variante: "cliente" | "interno") {
    try {
      await abrirPdfCotizacion({ id: cotizacionId, perfil, variante })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir el PDF.")
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex" title={bloqueado ? motivo : undefined}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={bloqueado}
            onClick={() => void abrir("cliente")}
          >
            Descargar PDF
          </Button>
        </span>
        {verInterno ? (
          <span className="inline-flex" title={bloqueado ? motivo : undefined}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={bloqueado}
              onClick={() => void abrir("interno")}
            >
              Ver PDF interno
            </Button>
          </span>
        ) : null}
      </div>
      {bloqueado ? <p className="text-kicker">{motivo}</p> : null}
    </div>
  )
}
