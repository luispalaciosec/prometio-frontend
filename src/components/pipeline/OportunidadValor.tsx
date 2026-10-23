import { formatMoney } from "@/lib/costo-interno"
import type { Oportunidad } from "@/types/oportunidad"

/**
 * Valor de una oportunidad, siempre etiquetado: el cotizado en firme si existe; si no, el referencial como
 * "estimado". Un referencial en 0 es "sin valor" (lo dejan así las altas automáticas), no un estimado de $0.
 */
export function OportunidadValor({
  valor_referencial,
  valor_cotizado,
}: Pick<Oportunidad, "valor_referencial" | "valor_cotizado">) {
  if (valor_cotizado != null && valor_cotizado > 0) {
    return <span className="tabular-nums">{formatMoney(valor_cotizado)}</span>
  }
  if (valor_referencial != null && valor_referencial > 0) {
    return (
      <span className="tabular-nums">
        {formatMoney(valor_referencial)} <span className="text-muted-foreground">estimado</span>
      </span>
    )
  }
  return <span className="text-muted-foreground">Sin valor</span>
}
