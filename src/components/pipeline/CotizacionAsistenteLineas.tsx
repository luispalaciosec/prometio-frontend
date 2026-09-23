import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api-client"
import { createLinea, sugerirLineasCotizacion } from "@/lib/api/cotizacion"
import type { SugerenciaLineaAsistente } from "@/types/cotizacion"
import type { Perfil } from "@/types/perfil"

export function CotizacionAsistenteLineas({
  cotizacionId,
  perfil,
  onLineaAgregada,
}: {
  cotizacionId: string
  perfil: Perfil
  onLineaAgregada: () => Promise<void>
}) {
  const [pedido, setPedido] = useState("")
  const [cargando, setCargando] = useState(false)
  const [sugerencias, setSugerencias] = useState<SugerenciaLineaAsistente[] | null>(null)
  const [confirmando, setConfirmando] = useState<string | null>(null)

  async function generar() {
    const texto = pedido.trim()
    if (!texto) {
      toast.error("Escribí qué pidió el cliente.")
      return
    }
    setCargando(true)
    setSugerencias(null)
    try {
      const resp = await sugerirLineasCotizacion(cotizacionId, texto)
      setSugerencias(resp.sugerencias)
      if (resp.sugerencias.length === 0) {
        toast.message("Sin sugerencias — probá con más detalle o armá la línea manual.")
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 502) {
        toast.error("No se pudo generar el borrador, intentá de nuevo o armá la línea manualmente.")
      } else {
        toast.error(error instanceof Error ? error.message : "No se pudo generar el borrador.")
      }
    } finally {
      setCargando(false)
    }
  }

  async function confirmar(row: SugerenciaLineaAsistente, key: string) {
    if (row.requiere_proveedor || !row.servicio_id) {
      toast.message(
        row.servicio_id
          ? "Esta línea lleva proveedor — agregala con «Nueva línea» y el costo correspondiente."
          : "Ítem a medida — usá «No está en el catálogo» en Nueva línea y completá descripción y precio.",
      )
      return
    }
    setConfirmando(key)
    try {
      if (row.servicio_id) {
        await createLinea({
          perfil,
          cotizacion_id: cotizacionId,
          servicio_id: row.servicio_id,
          descripcion: row.descripcion.trim() || null,
          cantidad: row.cantidad,
        })
        toast.success("Línea agregada desde sugerencia.")
      }
      await onLineaAgregada()
      setSugerencias((prev) => prev?.filter((item) => item !== row) ?? null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo agregar la línea.")
    } finally {
      setConfirmando(null)
    }
  }

  return (
    <div className="surface-card space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-highlight" strokeWidth={1.75} />
        <p className="text-ui-medium">Asistente de borrador</p>
      </div>
      <p className="text-kicker">
        Describe el pedido del cliente. La IA propone líneas para revisar — nada se guarda hasta que
        confirmes cada una.
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="asistente-pedido">Pedido del cliente</Label>
        <Textarea
          id="asistente-pedido"
          value={pedido}
          onChange={(event) => setPedido(event.target.value)}
          rows={3}
          placeholder="Ej. rediseño web corporativo + campaña Google Ads 3 meses…"
        />
      </div>
      <Button type="button" disabled={cargando} onClick={() => void generar()}>
        {cargando ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Generando…
          </>
        ) : (
          "Sugerir líneas"
        )}
      </Button>
      {sugerencias && sugerencias.length > 0 ? (
        <ul className="space-y-3">
          {sugerencias.map((row, index) => {
            const key = `${row.servicio_id ?? "custom"}-${index}`
            return (
              <li key={key} className="surface-muted space-y-2 p-3">
                <p className="text-ui-medium">
                  {row.servicio_nombre_sugerido}
                  {row.servicio_id ? null : " · a medida"}
                </p>
                <p className="text-kicker">{row.descripcion}</p>
                <p className="text-micro text-muted-foreground">
                  Cantidad {row.cantidad} ·{" "}
                  {row.requiere_proveedor ? "con proveedor" : "precio directo"} · {row.motivo}
                </p>
                <Button
                  type="button"
                  size="sm"
                  disabled={confirmando != null}
                  onClick={() => void confirmar(row, key)}
                >
                  {confirmando === key ? "Agregando…" : "Agregar esta línea"}
                </Button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
