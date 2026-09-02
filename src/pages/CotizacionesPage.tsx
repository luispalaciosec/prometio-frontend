import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { FileText } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { CotizacionEstadoBadge } from "@/components/pipeline/CotizacionEstadoBadge"
import { DocumentoAlcanceIndicador } from "@/components/pipeline/DocumentoAlcanceEstadoBadge"
import { DocumentoAlcancePendientes } from "@/components/pipeline/DocumentoAlcancePendientes"
import { TableSkeleton } from "@/components/skeleton"
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
import { listCotizaciones } from "@/lib/api/cotizacion"
import { listDocumentosAlcance } from "@/lib/api/documento-alcance"
import {
  etiquetaContacto,
  etiquetaEmpresa,
  listOportunidadesLookup,
} from "@/lib/api/oportunidad"
import { formatMoney } from "@/lib/costo-interno"
import { formatDateTime } from "@/lib/datetime-local"
import { puedeVerEquipo } from "@/lib/pipeline-acceso"
import { useAuthStore } from "@/store/auth-store"
import {
  COTIZACION_ESTADO_LABELS,
  COTIZACION_ESTADOS,
  type CotizacionConLineas,
  type CotizacionEstado,
} from "@/types/cotizacion"
import type { DocumentoAlcance } from "@/types/documento-alcance"

type FilaCotizacion = CotizacionConLineas & {
  contactoNombre: string
  empresaNombre: string
}

export function CotizacionesPage() {
  const navigate = useNavigate()
  const perfil = useAuthStore((state) => state.perfil)
  const [rows, setRows] = useState<FilaCotizacion[] | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [qDebounced, setQDebounced] = useState("")
  const [estado, setEstado] = useState<CotizacionEstado | null>(null)
  const [docsPorCotizacion, setDocsPorCotizacion] = useState<Record<string, DocumentoAlcance[]>>({})

  useEffect(() => {
    const t = window.setTimeout(() => setQDebounced(busqueda), 300)
    return () => window.clearTimeout(t)
  }, [busqueda])

  useEffect(() => {
    if (!perfil) {
      return
    }
    let cancelled = false
    setRows(null)
    setDocsPorCotizacion({})
    void (async () => {
      try {
        const [cotizaciones, oportunidades] = await Promise.all([
          listCotizaciones({ q: qDebounced, estado }),
          listOportunidadesLookup(),
        ])
        if (cancelled) {
          return
        }
        const oppById = new Map(oportunidades.map((row) => [row.id, row]))
        setRows(
          cotizaciones.map((row) => {
            const opp = oppById.get(row.oportunidad_id)
            return {
              ...row,
              contactoNombre: opp ? etiquetaContacto(opp.contacto_id) : "—",
              empresaNombre: opp ? etiquetaEmpresa(opp.empresa_id) : "—",
            }
          }),
        )
      } catch (error) {
        if (cancelled) {
          return
        }
        toast.error(error instanceof Error ? error.message : "No se pudieron cargar las cotizaciones.")
        setRows([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [perfil, qDebounced, estado])

  useEffect(() => {
    if (!rows) {
      return
    }
    let cancelled = false
    void Promise.all(rows.map(async (row) => [row.id, await listDocumentosAlcance(row.id)] as const))
      .then((pares) => {
        if (!cancelled) {
          setDocsPorCotizacion(Object.fromEntries(pares))
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "No se pudieron cargar los documentos de alcance.")
        }
      })
    return () => {
      cancelled = true
    }
  }, [rows])

  const pendientes = useMemo(() => {
    if (!rows || !perfil || !puedeVerEquipo(perfil)) {
      return []
    }
    return rows.flatMap((row) =>
      (docsPorCotizacion[row.id] ?? [])
        .filter((doc) => doc.estado === "pendiente_aprobacion")
        .map((documento) => ({
          documento,
          cotizacionNumero: row.numero,
          oportunidadId: row.oportunidad_id,
          contactoNombre: row.contactoNombre,
          empresaNombre: row.empresaNombre,
        })),
    )
  }, [rows, docsPorCotizacion, perfil])

  const hayFiltro = Boolean(qDebounced.trim() || estado)

  return (
    <>
      <PageHeader
        title="Cotizaciones"
        description="Todas las cotizaciones, sin entrar oportunidad por oportunidad."
      />
      {perfil && puedeVerEquipo(perfil) ? <DocumentoAlcancePendientes filas={pendientes} /> : null}
      <div className="filter-bar">
        <div className="filter-field sm:min-w-56 sm:flex-1">
          <Label htmlFor="cotizacion-global-busqueda">Buscar</Label>
          <Input
            id="cotizacion-global-busqueda"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Contacto, empresa o número"
          />
        </div>
        <div className="filter-field">
          <Label htmlFor="cotizacion-global-estado">Estado</Label>
          <Select
            value={estado ?? "all"}
            onValueChange={(value) =>
              setEstado(value === "all" ? null : (value as CotizacionEstado))
            }
          >
            <SelectTrigger id="cotizacion-global-estado">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {COTIZACION_ESTADOS.map((item) => (
                <SelectItem key={item} value={item}>
                  {COTIZACION_ESTADO_LABELS[item]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {rows == null ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={hayFiltro ? "Nada coincide" : "Sin cotizaciones"}
          body={
            hayFiltro
              ? "Ninguna cotización pasa esos filtros."
              : "Cuando armes una en una oportunidad, aparece acá."
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Contacto / empresa</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Alcance</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() =>
                  navigate(`/pipeline/${row.oportunidad_id}?cotizacion=${row.id}`)
                }
              >
                <TableCell className="text-ui-medium">{row.numero}</TableCell>
                <TableCell className="whitespace-normal">
                  <p className="text-ui-medium">{row.contactoNombre}</p>
                  <p className="text-kicker text-muted-foreground">{row.empresaNombre}</p>
                </TableCell>
                <TableCell>
                  <CotizacionEstadoBadge estado={row.estado} />
                </TableCell>
                <TableCell>
                  <DocumentoAlcanceIndicador docs={docsPorCotizacion[row.id]} />
                </TableCell>
                <TableCell className="text-right tabular-nums text-ui">
                  {formatMoney(row.total_cotizacion)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(row.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  )
}
