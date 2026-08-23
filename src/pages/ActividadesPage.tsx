import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { CalendarClock } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { ActividadEstadoBadge } from "@/components/pipeline/ActividadEstadoBadge"
import { TipoActividadMark } from "@/components/pipeline/TipoActividadMark"
import { TableSkeleton } from "@/components/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listActividades } from "@/lib/api/actividad"
import { listContactos } from "@/lib/api/contacto"
import { listPerfiles, listPerfilesElegiblesEjecutivo } from "@/lib/api/perfiles"
import { formatDateTime } from "@/lib/datetime-local"
import { puedeVerEquipo } from "@/lib/pipeline-acceso"
import { useAuthStore } from "@/store/auth-store"
import type { Actividad } from "@/types/actividad"
import type { Perfil } from "@/types/perfil"

export function ActividadesPage() {
  const navigate = useNavigate()
  const perfil = useAuthStore((state) => state.perfil)
  const mostrarAlcance = perfil ? puedeVerEquipo(perfil) : false
  const [rows, setRows] = useState<Actividad[] | null>(null)
  const [nombres, setNombres] = useState({
    contactos: new Map<string, string>(),
    responsables: new Map<string, string>(),
  })
  const [ejecutivos, setEjecutivos] = useState<Perfil[]>([])
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [responsableId, setResponsableId] = useState<string | null>(null)

  async function reload(filtro?: { desde: string; hasta: string; responsable_id: string | null }) {
    if (!perfil) {
      return
    }
    const desdeFiltro = filtro?.desde ?? desde
    const hastaFiltro = filtro?.hasta ?? hasta
    const responsableFiltro = filtro ? filtro.responsable_id : responsableId
    try {
      const query: Parameters<typeof listActividades>[0] = { perfil }
      if (desdeFiltro && hastaFiltro) {
        query.desde = `${desdeFiltro}T00:00:00`
        query.hasta = `${hastaFiltro}T23:59:59`
      }
      if (mostrarAlcance) {
        if (responsableFiltro) {
          query.responsable_id = responsableFiltro
        }
      } else {
        query.responsable_id = perfil.id
      }
      const [actividades, contactos, perfiles] = await Promise.all([
        listActividades(query),
        listContactos({ incluir_inactivos: true }),
        listPerfiles(),
      ])
      setRows(actividades)
      setNombres({
        contactos: new Map(contactos.map((row) => [row.id, row.nombre_completo])),
        responsables: new Map(perfiles.map((row) => [row.id, row.nombre_completo])),
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar las actividades.")
      setRows([])
    }
  }

  useEffect(() => {
    if (!perfil) {
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const query: Parameters<typeof listActividades>[0] = { perfil }
        if (!mostrarAlcance) {
          query.responsable_id = perfil.id
        }
        const [actividades, contactos, perfiles] = await Promise.all([
          listActividades(query),
          listContactos({ incluir_inactivos: true }),
          listPerfiles(),
        ])
        if (cancelled) {
          return
        }
        setRows(actividades)
        setNombres({
          contactos: new Map(contactos.map((row) => [row.id, row.nombre_completo])),
          responsables: new Map(perfiles.map((row) => [row.id, row.nombre_completo])),
        })
      } catch (error) {
        if (cancelled) {
          return
        }
        toast.error(error instanceof Error ? error.message : "No se pudieron cargar las actividades.")
        setRows([])
      }
    })()
    if (mostrarAlcance) {
      void listPerfilesElegiblesEjecutivo()
        .then(setEjecutivos)
        .catch(() => setEjecutivos([]))
    }
    return () => {
      cancelled = true
    }
  }, [perfil, mostrarAlcance])

  const hayFiltro = Boolean(desde && hasta) || Boolean(responsableId)

  const tituloRango = useMemo(() => {
    if (mostrarAlcance && !responsableId) {
      return "Agenda del equipo. Programar o reportar sigue en la oportunidad."
    }
    return "Tu agenda. Programar o reportar sigue en la oportunidad."
  }, [mostrarAlcance, responsableId])

  return (
    <>
      <PageHeader title="Actividades" description={tituloRango} />
      <form
        className="filter-bar"
        onSubmit={(event) => {
          event.preventDefault()
          if ((desde && !hasta) || (!desde && hasta)) {
            toast.error("Elegí desde y hasta.")
            return
          }
          void reload()
        }}
      >
        <div className="filter-field">
          <Label htmlFor="agenda-desde">Desde</Label>
          <Input
            id="agenda-desde"
            type="date"
            value={desde}
            onChange={(event) => setDesde(event.target.value)}
          />
        </div>
        <div className="filter-field">
          <Label htmlFor="agenda-hasta">Hasta</Label>
          <Input
            id="agenda-hasta"
            type="date"
            value={hasta}
            onChange={(event) => setHasta(event.target.value)}
          />
        </div>
        {mostrarAlcance ? (
          <div className="filter-field">
            <Label htmlFor="agenda-responsable">Responsable</Label>
            <Select
              value={responsableId ?? "all"}
              onValueChange={(value) => setResponsableId(value === "all" ? null : value)}
            >
              <SelectTrigger id="agenda-responsable">
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
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={hayFiltro ? "Nada coincide" : "Sin actividades"}
          body={
            hayFiltro
              ? "Ninguna actividad pasa esos filtros. Probá otro rango o responsable."
              : "Cuando el equipo programe o reporte, aparecen acá. No están anidadas a una sola oportunidad."
          }
          action={
            hayFiltro ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDesde("")
                  setHasta("")
                  setResponsableId(null)
                  void reload({ desde: "", hasta: "", responsable_id: null })
                }}
              >
                Limpiar filtros
              </Button>
            ) : null
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Programada</TableHead>
              <TableHead>Reportada</TableHead>
              {mostrarAlcance ? <TableHead>Responsable</TableHead> : null}
              <TableHead>Contacto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const destino = row.oportunidad_id
                ? `/pipeline/${row.oportunidad_id}`
                : row.contacto_id
                  ? `/contactos/${row.contacto_id}`
                  : null
              return (
                <TableRow
                  key={row.id}
                  className={destino ? "cursor-pointer" : undefined}
                  onClick={() => {
                    if (destino) {
                      navigate(destino)
                    }
                  }}
                >
                  <TableCell>
                    <TipoActividadMark tipo={row.tipo} />
                  </TableCell>
                  <TableCell>
                    <ActividadEstadoBadge actividad={row} />
                  </TableCell>
                  <TableCell className="text-ui">{formatDateTime(row.programada_para)}</TableCell>
                  <TableCell className="text-ui">{formatDateTime(row.reportada_en)}</TableCell>
                  {mostrarAlcance ? (
                    <TableCell className="text-ui">
                      {nombres.responsables.get(row.responsable_id) ?? "—"}
                    </TableCell>
                  ) : null}
                  <TableCell className="text-ui">
                    {row.contacto_id ? (nombres.contactos.get(row.contacto_id) ?? "—") : "—"}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </>
  )
}
