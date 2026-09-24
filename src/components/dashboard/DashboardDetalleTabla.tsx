import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatMoney } from "@/lib/costo-interno"
import { cn } from "@/lib/utils"
import type { DashboardDetalleFila } from "@/types/dashboard-detalle"

const DIAS_SIN_ACTIVIDAD_ALERTA = 7

type SortKey = "empresa" | "valor" | "etapa" | "ejecutivo" | "dias"

function SortHead({
  label,
  active,
  desc,
  onClick,
  align = "left",
}: {
  label: string
  active: boolean
  desc: boolean
  onClick: () => void
  align?: "left" | "right"
}) {
  const Icon = active ? (desc ? ArrowDown : ArrowUp) : ArrowUpDown
  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "-ml-2 h-8 gap-1 px-2 text-kicker font-medium",
          align === "right" && "ml-auto -mr-2",
          !active && "text-muted-foreground",
        )}
        onClick={onClick}
      >
        {label}
        <Icon className={cn("size-3.5", !active && "opacity-50")} aria-hidden />
      </Button>
    </TableHead>
  )
}

export function DashboardDetalleTabla({
  filas,
  mostrarCausa,
}: {
  filas: DashboardDetalleFila[]
  mostrarCausa?: boolean
}) {
  const navigate = useNavigate()
  const [sortKey, setSortKey] = useState<SortKey>("valor")
  const [sortDesc, setSortDesc] = useState(true)

  const ordenadas = useMemo(() => {
    const next = [...filas]
    next.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "empresa":
          cmp = (a.empresa ?? "").localeCompare(b.empresa ?? "")
          break
        case "ejecutivo":
          cmp = (a.ejecutivo ?? "").localeCompare(b.ejecutivo ?? "")
          break
        case "etapa":
          cmp = a.etapa_nombre.localeCompare(b.etapa_nombre)
          break
        case "dias":
          cmp = (a.dias_sin_actividad ?? -1) - (b.dias_sin_actividad ?? -1)
          break
        case "valor":
          cmp = a.valor - b.valor
          break
      }
      return sortDesc ? -cmp : cmp
    })
    return next
  }, [filas, sortKey, sortDesc])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDesc((prev) => !prev)
      return
    }
    setSortKey(key)
    setSortDesc(key === "empresa" || key === "ejecutivo" ? false : true)
  }

  if (filas.length === 0) {
    return <p className="text-kicker text-muted-foreground">No hay oportunidades en este detalle.</p>
  }

  return (
    <div className="max-h-[min(50vh,420px)] overflow-auto rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortHead
              label="Empresa"
              active={sortKey === "empresa"}
              desc={sortDesc}
              onClick={() => toggleSort("empresa")}
            />
            <TableHead>Contacto</TableHead>
            <SortHead
              label="Ejecutivo"
              active={sortKey === "ejecutivo"}
              desc={sortDesc}
              onClick={() => toggleSort("ejecutivo")}
            />
            <SortHead
              label="Etapa"
              active={sortKey === "etapa"}
              desc={sortDesc}
              onClick={() => toggleSort("etapa")}
            />
            <SortHead
              label="Valor"
              active={sortKey === "valor"}
              desc={sortDesc}
              align="right"
              onClick={() => toggleSort("valor")}
            />
            <SortHead
              label="Días sin act."
              active={sortKey === "dias"}
              desc={sortDesc}
              align="right"
              onClick={() => toggleSort("dias")}
            />
            {mostrarCausa ? <TableHead>Causa</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordenadas.map((row) => {
            const alerta =
              row.dias_sin_actividad != null && row.dias_sin_actividad >= DIAS_SIN_ACTIVIDAD_ALERTA
            return (
              <TableRow
                key={row.oportunidad_id}
                className={cn(
                  "cursor-pointer hover:bg-muted/50",
                  alerta && "bg-warning/5",
                )}
                onClick={() => navigate(`/pipeline/${row.oportunidad_id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    navigate(`/pipeline/${row.oportunidad_id}`)
                  }
                }}
                tabIndex={0}
              >
                <TableCell className="text-ui-medium">{row.empresa ?? "—"}</TableCell>
                <TableCell className="text-kicker">{row.contacto ?? "—"}</TableCell>
                <TableCell className="text-kicker">{row.ejecutivo ?? "—"}</TableCell>
                <TableCell className="text-kicker">{row.etapa_nombre}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(row.valor)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.dias_sin_actividad != null ? (
                    <span className={cn(alerta && "font-medium text-warning")}>{row.dias_sin_actividad}</span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                {mostrarCausa ? (
                  <TableCell className="max-w-[160px] truncate text-kicker" title={row.causa_perdida ?? undefined}>
                    {row.causa_perdida ?? "—"}
                  </TableCell>
                ) : null}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
