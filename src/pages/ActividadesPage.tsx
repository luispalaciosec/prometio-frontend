import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { CalendarClock } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { FiltroMes } from "@/components/filtro-mes"
import { PageHeader } from "@/components/page-header"
import { ActividadEstadoBadge } from "@/components/pipeline/ActividadEstadoBadge"
import { estadoActividad } from "@/lib/actividad-estado"
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
import { getEstadoCalendar } from "@/lib/api/google-calendar"
import { listContactos } from "@/lib/api/contacto"
import { listPerfiles, listPerfilesElegiblesEjecutivo } from "@/lib/api/perfiles"
import { formatPeriodo, mesActualEcuador } from "@/lib/contrato-recurrente"
import { formatDateTime } from "@/lib/datetime-local"
import { puedeVerEquipo } from "@/lib/pipeline-acceso"
import { useAuthStore } from "@/store/auth-store"
import { TIPO_ACTIVIDAD_LABELS, TIPOS_ACTIVIDAD, type Actividad, type TipoActividad } from "@/types/actividad"
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
  // Mes y rango se excluyen: el backend responde 422 si llegan los dos.
  const [mes, setMes] = useState(mesActualEcuador)
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [responsableId, setResponsableId] = useState<string | null>(null)
  const [tipo, setTipo] = useState<TipoActividad | null>(null)
  const [contactoId, setContactoId] = useState<string | null>(null)
  const [estadoFiltro, setEstadoFiltro] = useState<"programada" | "reportada" | null>(null)
  const [calendarConectado, setCalendarConectado] = useState<boolean | null>(null)

  async function reload(filtro?: { mes?: string; desde?: string; hasta?: string; responsable_id?: string | null }) {
    if (!perfil) {
      return
    }
    const mesFiltro = filtro?.mes ?? mes
    const desdeFiltro = filtro?.desde ?? desde
    const hastaFiltro = filtro?.hasta ?? hasta
    const responsableFiltro = filtro && "responsable_id" in filtro ? filtro.responsable_id : responsableId
    setRows(null)
    try {
      const query: Parameters<typeof listActividades>[0] = { perfil }
      if (mesFiltro) {
        query.mes = mesFiltro
      } else if (desdeFiltro && hastaFiltro) {
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
        // Arranca en el mes actual.
        const query: Parameters<typeof listActividades>[0] = { perfil, mes: mesActualEcuador() }
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
    void getEstadoCalendar()
      .then((estado) => {
        if (!cancelled) {
          setCalendarConectado(estado.conectado)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCalendarConectado(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [perfil, mostrarAlcance])

  function elegirMes(next: string) {
    setMes(next)
    setDesde("")
    setHasta("")
    void reload({ mes: next, desde: "", hasta: "" })
  }

  const hayFiltro =
    Boolean(desde && hasta) ||
    Boolean(responsableId) ||
    Boolean(tipo) ||
    Boolean(contactoId) ||
    Boolean(estadoFiltro)

  const visibles = useMemo(() => {
    if (rows == null) {
      return []
    }
    return rows.filter((row) => {
      if (tipo && row.tipo !== tipo) {
        return false
      }
      if (contactoId && row.contacto_id !== contactoId) {
        return false
      }
      if (estadoFiltro && estadoActividad(row) !== estadoFiltro) {
        return false
      }
      return true
    })
  }, [rows, tipo, contactoId, estadoFiltro])

  const tituloRango = useMemo(() => {
    if (mostrarAlcance && !responsableId) {
      return "Agenda del equipo. Programar o reportar sigue en la oportunidad."
    }
    return "Tu agenda. Programar o reportar sigue en la oportunidad."
  }, [mostrarAlcance, responsableId])

  return (
    <>
      <PageHeader title="Actividades" description={tituloRango} />
      {calendarConectado === false ? (
        <p className="mb-4 text-kicker">
          Las visitas y videollamadas no llegan a Google Calendar hasta que lo conectés en{" "}
          <Link to="/cuenta" className="text-primary underline-offset-4 hover:underline">
            Mi cuenta
          </Link>
          .
        </p>
      ) : null}
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
          <FiltroMes id="agenda-mes" value={mes} onChange={elegirMes} />
        </div>
        <div className="filter-field">
          <Label htmlFor="agenda-desde">Desde</Label>
          <Input
            id="agenda-desde"
            type="date"
            value={desde}
            onChange={(event) => {
              setDesde(event.target.value)
              setMes("")
            }}
          />
        </div>
        <div className="filter-field">
          <Label htmlFor="agenda-hasta">Hasta</Label>
          <Input
            id="agenda-hasta"
            type="date"
            value={hasta}
            onChange={(event) => {
              setHasta(event.target.value)
              setMes("")
            }}
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
        <div className="filter-field">
          <Label htmlFor="agenda-tipo">Tipo</Label>
          <Select
            value={tipo ?? "all"}
            onValueChange={(value) => setTipo(value === "all" ? null : (value as TipoActividad))}
          >
            <SelectTrigger id="agenda-tipo">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {TIPOS_ACTIVIDAD.map((item) => (
                <SelectItem key={item} value={item}>
                  {TIPO_ACTIVIDAD_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="filter-field">
          <Label htmlFor="agenda-contacto">Contacto</Label>
          <Select
            value={contactoId ?? "all"}
            onValueChange={(value) => setContactoId(value === "all" ? null : value)}
          >
            <SelectTrigger id="agenda-contacto">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {[...nombres.contactos.entries()]
                .sort((a, b) => a[1].localeCompare(b[1], "es"))
                .map(([id, nombre]) => (
                  <SelectItem key={id} value={id}>
                    {nombre}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="filter-field">
          <Label htmlFor="agenda-estado">Estado</Label>
          <Select
            value={estadoFiltro ?? "all"}
            onValueChange={(value) =>
              setEstadoFiltro(value === "all" ? null : (value as "programada" | "reportada"))
            }
          >
            <SelectTrigger id="agenda-estado">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="programada">Programada</SelectItem>
              <SelectItem value="reportada">Reportada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" variant="outline">
          Aplicar
        </Button>
      </form>
      {rows == null ? (
        <TableSkeleton />
      ) : visibles.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={mes ? `No hay actividades en ${formatPeriodo(mes, true)}` : hayFiltro ? "Nada coincide" : "Sin actividades"}
          body={
            hayFiltro
              ? "Ninguna actividad pasa esos filtros. Probá otro mes, rango, tipo, contacto o estado."
              : mes
                ? "Probá otro mes con las flechas o mirá todos los meses."
                : "Cuando el equipo programe o reporte, aparecen acá. No están anidadas a una sola oportunidad."
          }
          action={
            !hayFiltro && mes ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => elegirMes("")}>
                Ver todos los meses
              </Button>
            ) : hayFiltro ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDesde("")
                  setHasta("")
                  setResponsableId(null)
                  setTipo(null)
                  setContactoId(null)
                  setEstadoFiltro(null)
                  void reload({ desde: "", hasta: "", responsable_id: null })
                  // El mes elegido se conserva: «Limpiar» quita los demás filtros.
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
            {visibles.map((row) => {
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
