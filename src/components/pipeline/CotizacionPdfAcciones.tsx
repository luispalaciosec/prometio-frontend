import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { abrirPdfCotizacion } from "@/lib/api/cotizacion"
import { puedeVerDesgloseCotizacion } from "@/lib/pipeline-acceso"
import type { Perfil } from "@/types/perfil"

export function CotizacionPdfAcciones({
  cotizacionId,
  perfil,
  ejecutivoId,
}: {
  cotizacionId: string
  perfil: Perfil
  ejecutivoId: string
}) {
  const verInterno = puedeVerDesgloseCotizacion(perfil, ejecutivoId)

  async function abrir(variante: "cliente" | "interno") {
    try {
      await abrirPdfCotizacion({ id: cotizacionId, perfil, variante })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir el PDF.")
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => void abrir("cliente")}>
        Descargar PDF
      </Button>
      {verInterno ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => void abrir("interno")}>
          Ver PDF interno
        </Button>
      ) : null}
    </div>
  )
}
