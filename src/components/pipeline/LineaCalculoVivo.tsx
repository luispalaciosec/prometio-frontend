import { formatMoney } from "@/lib/costo-interno"
import type { CalculoLinea } from "@/types/linea-cotizacion"

export function LineaCalculoVivo({
  calculo,
  conProveedor,
}: {
  calculo: CalculoLinea | null
  conProveedor: boolean
}) {
  if (!calculo) {
    return (
      <p className="text-xs text-muted-foreground">
        Completa los datos de la línea para ver el cálculo en vivo.
      </p>
    )
  }

  return (
    <dl className="grid gap-1 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">
          {conProveedor ? "precio_venta_base" : "precio_base_cliente"}
        </dt>
        <dd className="tabular-nums">{formatMoney(calculo.precio_venta_base)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">subtotal_con_comision</dt>
        <dd className="tabular-nums">
          {conProveedor ? (
            formatMoney(calculo.subtotal_con_comision)
          ) : (
            <span className="text-muted-foreground">no aplica</span>
          )}
        </dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">total_linea</dt>
        <dd className="tabular-nums font-medium">{formatMoney(calculo.total_linea)}</dd>
      </div>
    </dl>
  )
}
