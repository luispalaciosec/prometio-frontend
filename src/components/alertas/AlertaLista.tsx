import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Bell } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { AlertaEstadoBadge } from "@/components/alertas/AlertaEstadoBadge"
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
import { formatDateTime } from "@/lib/datetime-local"
import { coincideTexto } from "@/lib/lista-filtros"
import { cn } from "@/lib/utils"
import type { Alerta, EstadoAlerta } from "@/types/alerta"
import type { EtapaPipeline, EtapaPipelineCodigo } from "@/types/etapa-pipeline"

export type AlertaVista = Alerta & {
  contactoNombre: string
  empresaNombre: string
  ejecutivoNombre: string
  etapaNombre: string
}

function formatHoras(horas: number): string {
  const rounded = horas >= 10 ? Math.round(horas) : Math.round(horas * 10) / 10
  return `${rounded} h`
}

export function AlertaLista({
  alertas,
  etapas,
  mostrarEjecutivo,
}: {
  alertas: AlertaVista[]
  etapas: EtapaPipeline[]
  mostrarEjecutivo: boolean
}) {
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState("")
  const [etapaId, setEtapaId] = useState<EtapaPipelineCodigo | null>(null)
  const [estado, setEstado] = useState<EstadoAlerta | null>(null)
  const [ejecutivoId, setEjecutivoId] = useState<string | null>(null)

  const ejecutivos = useMemo(() => {
    const seen = new Map<string, string>()
    for (const row of alertas) {
      seen.set(row.ejecutivo_id, row.ejecutivoNombre)
    }
    return [...seen.entries()]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
  }, [alertas])

  const filtradas = useMemo(() => {
    return alertas.filter((row) => {
      if (etapaId && row.etapa !== etapaId) {
        return false
      }
      if (estado && row.estado_alerta !== estado) {
        return false
      }
      if (ejecutivoId && row.ejecutivo_id !== ejecutivoId) {
        return false
      }
      return coincideTexto(busqueda, row.contactoNombre, row.empresaNombre)
    })
  }, [alertas, etapaId, estado, ejecutivoId, busqueda])

  const hayFiltro = Boolean(busqueda.trim() || etapaId || estado || ejecutivoId)
  const etapasOrdenadas = [...etapas].sort((a, b) => a.orden - b.orden)

  if (alertas.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="Todo al día"
        body="Ninguna oportunidad cruzó el umbral de estancamiento."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-56 flex-1 flex-col gap-2">
          <Label htmlFor="alerta-busqueda">Buscar</Label>
          <Input
            id="alerta-busqueda"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Contacto o empresa"
          />
        </div>
        <div className="flex min-w-44 flex-col gap-2">
          <Label htmlFor="alerta-etapa">Etapa</Label>
          <Select
            value={etapaId ?? "all"}
            onValueChange={(value) =>
              setEtapaId(value === "all" ? null : (value as EtapaPipelineCodigo))
            }
          >
            <SelectTrigger id="alerta-etapa" className="w-44">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las etapas</SelectItem>
              {etapasOrdenadas.map((etapa) => (
                <SelectItem key={etapa.codigo} value={etapa.codigo}>
                  {etapa.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-36 flex-col gap-2">
          <Label htmlFor="alerta-estado">Estado</Label>
          <Select
            value={estado ?? "all"}
            onValueChange={(value) =>
              setEstado(value === "all" ? null : (value as EstadoAlerta))
            }
          >
            <SelectTrigger id="alerta-estado" className="w-36">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="alerta">alerta</SelectItem>
              <SelectItem value="escalada">escalada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {mostrarEjecutivo ? (
          <div className="flex min-w-44 flex-col gap-2">
            <Label htmlFor="alerta-ejecutivo">Ejecutivo</Label>
            <Select
              value={ejecutivoId ?? "all"}
              onValueChange={(value) => setEjecutivoId(value === "all" ? null : value)}
            >
              <SelectTrigger id="alerta-ejecutivo" className="w-44">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {ejecutivos.map((ejecutivo) => (
                  <SelectItem key={ejecutivo.id} value={ejecutivo.id}>
                    {ejecutivo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </div>
      {filtradas.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={hayFiltro ? "Nada coincide" : "Todo al día"}
          body={
            hayFiltro
              ? "Ninguna alerta pasa esos filtros."
              : "Ninguna oportunidad cruzó el umbral de estancamiento."
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Ejecutivo</TableHead>
              <TableHead>Última actividad</TableHead>
              <TableHead className="text-right">Horas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.map((alerta) => (
              <TableRow
                key={alerta.oportunidad_id}
                className={cn(
                  "cursor-pointer transition-colors duration-150 hover:bg-muted/40",
                  alerta.estado_alerta === "escalada" && "bg-destructive/5 hover:bg-destructive/10",
                  alerta.estado_alerta === "alerta" && "bg-warning/5 hover:bg-warning/10",
                )}
                onClick={() => navigate(`/pipeline/${alerta.oportunidad_id}`)}
              >
                <TableCell>
                  <AlertaEstadoBadge estado={alerta.estado_alerta} />
                </TableCell>
                <TableCell className="text-ui-medium">{alerta.contactoNombre}</TableCell>
                <TableCell>{alerta.empresaNombre}</TableCell>
                <TableCell>{alerta.etapaNombre}</TableCell>
                <TableCell>{alerta.ejecutivoNombre}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(alerta.fecha_ultima_actividad)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    alerta.estado_alerta === "escalada" && "text-destructive",
                    alerta.estado_alerta === "alerta" && "text-warning",
                  )}
                >
                  {formatHoras(alerta.horas_transcurridas)}
                  <span className="block text-xs font-normal text-muted-foreground">
                    umbral {formatHoras(alerta.umbral_alerta_horas)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
