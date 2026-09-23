import { useEffect, useState } from "react"

import { formatMoney } from "@/lib/costo-interno"
import { getSugerenciaPrecio, type SugerenciaPrecioResponse } from "@/lib/config-api"

export function SugerenciaPrecioPanel({
  servicioId,
  precioActual,
}: {
  servicioId: string
  precioActual: number | null
}) {
  const [data, setData] = useState<SugerenciaPrecioResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    void getSugerenciaPrecio(servicioId, 12)
      .then((row) => {
        if (!cancelled) {
          setData(row)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [servicioId])

  if (!data || data.muestras === 0) {
    return null
  }

  const bajoMinimo =
    data.precio_sugerido_min != null &&
    precioActual != null &&
    precioActual < data.precio_sugerido_min

  return (
    <div
      className={
        bajoMinimo
          ? "rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-kicker"
          : "rounded-lg border border-border bg-muted/30 px-3 py-2 text-kicker"
      }
    >
      <p className="text-ui-medium text-foreground">Referencia de precio (últimos 12 meses)</p>
      <p className="mt-1">
        {data.muestras} cotización{data.muestras === 1 ? "" : "es"} ganada
        {data.precio_sugerido_min != null && data.precio_sugerido_max != null
          ? ` · rango ${formatMoney(data.precio_sugerido_min)} – ${formatMoney(data.precio_sugerido_max)}`
          : null}
        {data.precio_promedio != null ? ` · promedio ${formatMoney(data.precio_promedio)}` : null}
        {data.precio_catalogo != null ? ` · catálogo ${formatMoney(data.precio_catalogo)}` : null}
      </p>
      {bajoMinimo ? (
        <p className="mt-1 text-warning">
          El precio que estás usando está por debajo del mínimo histórico. Revisá antes de enviar.
        </p>
      ) : null}
    </div>
  )
}
