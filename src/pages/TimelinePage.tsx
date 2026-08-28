import { useEffect, useState } from "react"
import { toast } from "sonner"
import { History } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { TimelineSkeleton } from "@/components/skeleton"
import { TimelineEventoFila } from "@/components/timeline/TimelineEventoFila"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { listPerfilesElegiblesEjecutivo } from "@/lib/api/perfiles"
import { listTimeline } from "@/lib/api/timeline"
import { puedeVerEquipo } from "@/lib/pipeline-acceso"
import { agruparTimelinePorDia } from "@/lib/timeline-grupos"
import { useAuthStore } from "@/store/auth-store"
import type { Perfil } from "@/types/perfil"
import {
  TIPOS_TIMELINE,
  TIPO_TIMELINE_LABELS,
  type TimelineEvento,
  type TipoTimeline,
} from "@/types/timeline"

export function TimelinePage() {
  const perfil = useAuthStore((state) => state.perfil)
  const mostrarAlcance = perfil ? puedeVerEquipo(perfil) : false
  const [rows, setRows] = useState<TimelineEvento[] | null>(null)
  const [ejecutivos, setEjecutivos] = useState<Perfil[]>([])
  const [tipoEvento, setTipoEvento] = useState<TipoTimeline | null>(null)
  const [perfilId, setPerfilId] = useState<string | null>(null)

  async function reload(filtro?: { tipo_evento: TipoTimeline | null; perfil_id: string | null }) {
    const tipo = filtro ? filtro.tipo_evento : tipoEvento
    const quien = filtro ? filtro.perfil_id : perfilId
    try {
      setRows(
        await listTimeline({
          tipo_evento: tipo ?? undefined,
          perfil_id: quien ?? undefined,
        }),
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el timeline.")
      setRows([])
    }
  }

  useEffect(() => {
    let cancelled = false
    void listTimeline()
      .then((data) => {
        if (!cancelled) {
          setRows(data)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "No se pudo cargar el timeline.")
          setRows([])
        }
      })
    if (mostrarAlcance) {
      void listPerfilesElegiblesEjecutivo()
        .then((data) => {
          if (!cancelled) {
            setEjecutivos(data)
          }
        })
        .catch(() => {
          if (!cancelled) {
            setEjecutivos([])
          }
        })
    }
    return () => {
      cancelled = true
    }
  }, [perfil, mostrarAlcance])

  const hayFiltro = Boolean(tipoEvento) || Boolean(perfilId)

  return (
    <>
      <PageHeader
        title="Timeline"
        description="Feed del equipo: actividades reportadas, cierres, cotizaciones aprobadas y leads convertidos. Los últimos 100."
      />
      <form
        className="filter-bar"
        onSubmit={(event) => {
          event.preventDefault()
          void reload()
        }}
      >
        <div className="filter-field">
          <Label htmlFor="timeline-tipo">Tipo</Label>
          <Select
            value={tipoEvento ?? "all"}
            onValueChange={(value) => setTipoEvento(value === "all" ? null : (value as TipoTimeline))}
          >
            <SelectTrigger id="timeline-tipo">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {TIPOS_TIMELINE.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {TIPO_TIMELINE_LABELS[tipo]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {mostrarAlcance ? (
          <div className="filter-field">
            <Label htmlFor="timeline-quien">Quién</Label>
            <Select
              value={perfilId ?? "all"}
              onValueChange={(value) => setPerfilId(value === "all" ? null : value)}
            >
              <SelectTrigger id="timeline-quien">
                <SelectValue placeholder="Todo el equipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el equipo</SelectItem>
                {ejecutivos.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.nombre_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <Button type="submit" variant="outline">
          Aplicar
        </Button>
      </form>
      {rows == null ? (
        <TimelineSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={History}
          title={hayFiltro ? "Nada coincide" : "Sin eventos"}
          body={
            hayFiltro
              ? "Ningún evento pasa esos filtros. Probá otro tipo o persona."
              : "Cuando el equipo reporte una actividad, cierre una oportunidad, apruebe una cotización o convierta un lead, aparece acá."
          }
          action={
            hayFiltro ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTipoEvento(null)
                  setPerfilId(null)
                  void reload({ tipo_evento: null, perfil_id: null })
                }}
              >
                Limpiar filtros
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-6">
          {agruparTimelinePorDia(rows).map((grupo) => (
            <section key={grupo.clave} className="space-y-2">
              <h2 className="text-section">{grupo.label}</h2>
              <ul className="space-y-2">
                {grupo.eventos.map((row) => (
                  <li key={row.id}>
                    <TimelineEventoFila row={row} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
