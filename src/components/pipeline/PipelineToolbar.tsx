import { VistaToggle } from "@/components/vista-toggle"
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
import type { EtapaPipeline, EtapaPipelineCodigo } from "@/types/etapa-pipeline"
import type { PipelineScope } from "@/types/oportunidad"
import type { Servicio } from "@/types/servicio"

export type PipelineVista = "tablero" | "lista"

export function PipelineToolbar({
  busqueda,
  onBusqueda,
  etapas,
  etapaId,
  onEtapaId,
  ejecutivos,
  ejecutivoId,
  onEjecutivoId,
  mostrarEjecutivo,
  servicios,
  servicioId,
  onServicioId,
  mostrarAlcance,
  scope,
  onScope,
  vista,
  onVista,
}: {
  busqueda: string
  onBusqueda: (value: string) => void
  etapas: EtapaPipeline[]
  etapaId: EtapaPipelineCodigo | null
  onEtapaId: (codigo: EtapaPipelineCodigo | null) => void
  ejecutivos: { id: string; nombre_completo: string }[]
  ejecutivoId: string | null
  onEjecutivoId: (id: string | null) => void
  mostrarEjecutivo: boolean
  servicios: Servicio[]
  servicioId: string | null
  onServicioId: (id: string | null) => void
  mostrarAlcance: boolean
  scope: PipelineScope
  onScope: (scope: PipelineScope) => void
  vista: PipelineVista
  onVista: (vista: PipelineVista) => void
}) {
  const activos = servicios.filter((row) => row.estado === "activo")
  const etapasOrdenadas = [...etapas].sort((a, b) => a.orden - b.orden)

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-56 flex-1 flex-col gap-2">
        <Label htmlFor="filtro-busqueda">Buscar</Label>
        <Input
          id="filtro-busqueda"
          value={busqueda}
          onChange={(event) => onBusqueda(event.target.value)}
          placeholder="Contacto o empresa"
        />
      </div>
      <div className="flex min-w-44 flex-col gap-2">
        <Label htmlFor="filtro-etapa">Etapa</Label>
        <Select
          value={etapaId ?? "all"}
          onValueChange={(value) =>
            onEtapaId(value === "all" ? null : (value as EtapaPipelineCodigo))
          }
        >
          <SelectTrigger id="filtro-etapa" className="w-44">
            <SelectValue placeholder="Todas las etapas" />
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
      <div className="flex min-w-44 flex-col gap-2">
        <Label htmlFor="filtro-servicio">Servicio</Label>
        <Select
          value={servicioId ?? "all"}
          onValueChange={(value) => onServicioId(value === "all" ? null : value)}
        >
          <SelectTrigger id="filtro-servicio" className="w-44">
            <SelectValue placeholder="Todos los servicios" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los servicios</SelectItem>
            {activos.map((servicio) => (
              <SelectItem key={servicio.id} value={servicio.id}>
                {servicio.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {mostrarEjecutivo ? (
        <div className="flex min-w-44 flex-col gap-2">
          <Label htmlFor="filtro-ejecutivo">Ejecutivo</Label>
          <Select
            value={ejecutivoId ?? "all"}
            onValueChange={(value) => onEjecutivoId(value === "all" ? null : value)}
          >
            <SelectTrigger id="filtro-ejecutivo" className="w-44">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {ejecutivos.map((ejecutivo) => (
                <SelectItem key={ejecutivo.id} value={ejecutivo.id}>
                  {ejecutivo.nombre_completo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {mostrarAlcance ? (
        <div className="flex flex-col gap-2">
          <Label>Alcance</Label>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={scope === "mio" ? "default" : "outline"}
              onClick={() => onScope("mio")}
            >
              Lo mío
            </Button>
            <Button
              type="button"
              size="sm"
              variant={scope === "equipo" ? "default" : "outline"}
              onClick={() => onScope("equipo")}
            >
              Todo el equipo
            </Button>
          </div>
        </div>
      ) : null}
      <VistaToggle
        value={vista}
        onChange={onVista}
        opciones={[
          { value: "tablero", label: "Tablero" },
          { value: "lista", label: "Lista" },
        ]}
      />
    </div>
  )
}
