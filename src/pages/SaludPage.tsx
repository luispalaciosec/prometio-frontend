import { useEffect, useState } from "react"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { KindMark } from "@/components/kind-mark"
import { PageHeader } from "@/components/page-header"
import { TilesSkeleton } from "@/components/skeleton"
import { Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getSalud } from "@/lib/api/salud"
import { SALUD_SERVICIO_VISUAL } from "@/lib/salud-visual"
import { cn } from "@/lib/utils"
import {
  SALUD_ESTADO_LABELS,
  SALUD_SERVICIO_LABELS,
  type SaludEstado,
  type SaludSistema,
} from "@/types/salud"

const ESTADO_CLASE: Record<SaludEstado, string> = {
  operativo: "bg-success",
  degradado: "bg-warning",
  caido: "bg-destructive",
}

function formatoHora(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) {
    return iso
  }
  return fecha.toLocaleString("es-EC", { dateStyle: "short", timeStyle: "medium" })
}

export function SaludPage() {
  const [data, setData] = useState<SaludSistema | null>(null)
  const [cargando, setCargando] = useState(true)

  async function reload() {
    setCargando(true)
    try {
      setData(await getSalud())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo consultar la salud.")
      setData(null)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  return (
    <>
      <PageHeader
        title="Salud del sistema"
        description="Estado y latencia de los servicios. Sin detalle interno de errores."
        action={
          <Button type="button" variant="outline" disabled={cargando} onClick={() => void reload()}>
            {cargando ? "Consultando…" : "Actualizar"}
          </Button>
        }
      />
      {data ? (
        <p className="mb-6 text-kicker">
          Verificado {formatoHora(data.verificado_en)}
        </p>
      ) : null}
      {cargando && !data ? (
        <TilesSkeleton count={4} />
      ) : data == null ? (
        <EmptyState
          icon={Activity}
          title="Sin datos de salud"
          body="No se pudo consultar el estado de los servicios."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.servicios.map((servicio) => (
            <article
              key={servicio.nombre}
              className="flex items-start gap-4 rounded-xl p-5 ring-1 ring-border"
            >
              <KindMark
                icon={SALUD_SERVICIO_VISUAL[servicio.nombre].icon}
                tone={SALUD_SERVICIO_VISUAL[servicio.nombre].tone}
                size="lg"
              />
              <div className="min-w-0">
                <p className="text-section">{SALUD_SERVICIO_LABELS[servicio.nombre]}</p>
                <p className="mt-1 flex items-center gap-2 text-ui">
                  <span
                    aria-hidden
                    className={cn("size-2.5 shrink-0 rounded-full", ESTADO_CLASE[servicio.estado])}
                  />
                  {SALUD_ESTADO_LABELS[servicio.estado]}
                  {servicio.latencia_ms != null ? ` · ${servicio.latencia_ms} ms` : ""}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
