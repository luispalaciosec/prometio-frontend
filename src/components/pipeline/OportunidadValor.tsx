import type { Oportunidad } from "@/types/oportunidad"

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export function OportunidadValor({
  valor_referencial,
  valor_cotizado,
}: Pick<Oportunidad, "valor_referencial" | "valor_cotizado">) {
  if (valor_cotizado != null) {
    return <span className="tabular-nums">{money.format(valor_cotizado)}</span>
  }
  if (valor_referencial != null) {
    return (
      <span className="tabular-nums">
        {money.format(valor_referencial)}{" "}
        <span className="text-muted-foreground">estimado</span>
      </span>
    )
  }
  return <span className="text-muted-foreground">Sin valor</span>
}
