import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { CalendarioAgenda } from "@/components/calendario/CalendarioAgenda"
import { CalendarioMes } from "@/components/calendario/CalendarioMes"
import { CalendarioSemana } from "@/components/calendario/CalendarioSemana"
import { PageHeader } from "@/components/page-header"
import { TableSkeleton } from "@/components/skeleton"
import { Button } from "@/components/ui/button"
import { getCalendario } from "@/lib/api/calendario"
import {
  celdasRango,
  endOfMonth,
  endOfWeekSunday,
  etiquetaPeriodo,
  moverAncla,
  rangoDeVista,
  startOfMonth,
  startOfWeekMonday,
} from "@/lib/calendario-rango"
import type { EventoCalendario, VistaCalendario } from "@/types/calendario"

const VISTAS: { id: VistaCalendario; label: string }[] = [
  { id: "mes", label: "Mes" },
  { id: "semana", label: "Semana" },
  { id: "agenda", label: "Agenda" },
]

function vistaInicial(): VistaCalendario {
  if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
    return "mes"
  }
  return "agenda"
}

export function CalendarioPage() {
  const [vista, setVista] = useState<VistaCalendario>(vistaInicial)
  const [ancla, setAncla] = useState(() => new Date())
  const [eventos, setEventos] = useState<EventoCalendario[] | null>(null)

  const rango = useMemo(() => rangoDeVista(vista, ancla), [vista, ancla])

  useEffect(() => {
    let cancelled = false
    setEventos(null)
    void getCalendario({ desde: rango.desde, hasta: rango.hasta })
      .then((data) => {
        if (!cancelled) {
          setEventos(data.eventos)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "No se pudo cargar el calendario.")
          setEventos([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [rango.desde, rango.hasta])

  const celdas = useMemo(() => {
    const rows = eventos ?? []
    if (vista === "semana") {
      return celdasRango(startOfWeekMonday(ancla), endOfWeekSunday(ancla), ancla, rows)
    }
    if (vista === "agenda") {
      return celdasRango(startOfMonth(ancla), endOfMonth(ancla), ancla, rows)
    }
    return celdasRango(startOfWeekMonday(startOfMonth(ancla)), endOfWeekSunday(endOfMonth(ancla)), ancla, rows)
  }, [vista, ancla, eventos])

  return (
    <>
      <PageHeader
        title="Calendario"
        description="Actividades, cumpleaños y vencimientos de cotización en el mismo período."
      />
      <div className="filter-bar">
        <div className="flex flex-wrap gap-1">
          {VISTAS.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={vista === item.id ? "secondary" : "outline"}
              onClick={() => setVista(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setAncla((prev) => moverAncla(vista, prev, -1))}>
            Anterior
          </Button>
          <p className="min-w-36 text-ui-medium capitalize">{etiquetaPeriodo(vista, ancla)}</p>
          <Button type="button" size="sm" variant="outline" onClick={() => setAncla((prev) => moverAncla(vista, prev, 1))}>
            Siguiente
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setAncla(new Date())}>
            Hoy
          </Button>
        </div>
      </div>
      {eventos == null ? (
        <TableSkeleton rows={8} />
      ) : vista === "mes" ? (
        <CalendarioMes celdas={celdas} />
      ) : vista === "semana" ? (
        <CalendarioSemana celdas={celdas} />
      ) : (
        <CalendarioAgenda celdas={celdas} />
      )}
    </>
  )
}
