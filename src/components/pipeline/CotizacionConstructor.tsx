import { useState } from "react"
import { toast } from "sonner"

import { CotizacionEstadoBadge } from "@/components/pipeline/CotizacionEstadoBadge"
import { CotizacionPdfAcciones } from "@/components/pipeline/CotizacionPdfAcciones"
import { CotizacionTransiciones } from "@/components/pipeline/CotizacionTransiciones"
import { LineaCotizacionForm, type LineaCotizacionFormInput } from "@/components/pipeline/LineaCotizacionForm"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/costo-interno"
import {
  createLinea,
  deleteLinea,
  ejecutarTransicion,
  updateLinea,
  type AccionCotizacion,
} from "@/lib/api/cotizacion"
import type { ConfiguracionGeneral } from "@/types/configuracion-general"
import type { CotizacionConLineas } from "@/types/cotizacion"
import type { LineaCotizacion } from "@/types/linea-cotizacion"
import type { Perfil } from "@/types/perfil"
import type { Proveedor } from "@/types/proveedor"
import type { Servicio } from "@/types/servicio"

export function CotizacionConstructor({
  cotizacion,
  perfil,
  ejecutivoId,
  servicios,
  proveedores,
  config,
  onChange,
}: {
  cotizacion: CotizacionConLineas
  perfil: Perfil
  ejecutivoId: string
  servicios: Servicio[]
  proveedores: Proveedor[]
  config: ConfiguracionGeneral | null
  onChange: () => Promise<void>
}) {
  const esBorrador = cotizacion.estado === "borrador"
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [transicionPendiente, setTransicionPendiente] = useState(false)

  async function agregar(input: LineaCotizacionFormInput) {
    try {
      await createLinea({
        perfil,
        cotizacion_id: cotizacion.id,
        ...input,
      })
      await onChange()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo agregar la línea.")
    }
  }

  async function guardar(linea: LineaCotizacion, input: LineaCotizacionFormInput) {
    try {
      if (linea.costo_proveedor != null) {
        if (input.costo_proveedor == null || input.margen_pct == null || input.comision_agencia_pct == null) {
          toast.error("Esta línea es con proveedor: no se puede vaciar el camino.")
          return
        }
        await updateLinea({
          perfil,
          cotizacion_id: cotizacion.id,
          id: linea.id,
          proveedor_id: input.proveedor_id,
          costo_proveedor: input.costo_proveedor,
          margen_pct: input.margen_pct,
          comision_agencia_pct: input.comision_agencia_pct,
          cantidad: input.cantidad,
          descripcion: input.descripcion,
        })
      } else {
        await updateLinea({
          perfil,
          cotizacion_id: cotizacion.id,
          id: linea.id,
          cantidad: input.cantidad,
          descripcion: input.descripcion,
        })
      }
      setEditandoId(null)
      await onChange()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la línea.")
    }
  }

  async function borrar(id: string) {
    try {
      await deleteLinea({ perfil, cotizacion_id: cotizacion.id, id })
      if (editandoId === id) {
        setEditandoId(null)
      }
      await onChange()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo borrar la línea.")
    }
  }

  async function transicionar(accion: AccionCotizacion) {
    setTransicionPendiente(true)
    try {
      await ejecutarTransicion(cotizacion.id, perfil, accion)
      await onChange()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado.")
    } finally {
      setTransicionPendiente(false)
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-section">{cotizacion.numero}</p>
        <CotizacionEstadoBadge estado={cotizacion.estado} />
      </div>
      <div className="space-y-3 rounded-xl p-4 ring-1 ring-border">
        <div>
          <p className="text-ui-medium">Cambiar estado</p>
          <p className="mt-1 text-kicker">
            {esBorrador
              ? "Cuando las líneas estén listas, enviá la cotización. Si hay un descuento grande, pasa a preparación para que la apruebe un supervisor."
              : cotizacion.estado === "preparacion"
                ? "Un supervisor o admin aprueba o rechaza el descuento. Recién después se puede enviar al cliente."
                : cotizacion.estado === "enviada"
                  ? "El cliente ya la tiene. Acá se marca el resultado: aprobada, rechazada o vencida."
                  : "Esta cotización ya no cambia de estado."}
          </p>
        </div>
        <CotizacionTransiciones
          perfil={perfil}
          estado={cotizacion.estado}
          ejecutivoId={ejecutivoId}
          disabled={transicionPendiente}
          onAccion={(accion) => void transicionar(accion)}
        />
      </div>
      <CotizacionPdfAcciones
        cotizacionId={cotizacion.id}
        perfil={perfil}
        ejecutivoId={ejecutivoId}
        sinLineas={cotizacion.lineas.length === 0}
      />
      {cotizacion.estado === "preparacion" ? (
        <p className="rounded-lg bg-secondary px-3 py-2 text-sm">
          Requiere aprobación por descuento
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        {esBorrador
          ? "Puedes agregar, editar valores del mismo camino o borrar para re-alta."
          : "Solo lectura — la edición de líneas es para borrador."}
      </p>
      <ul className="space-y-3">
        {cotizacion.lineas.map((linea) => {
          const servicio = servicios.find((row) => row.id === linea.servicio_id)
          if (editandoId === linea.id && esBorrador) {
            return (
              <li key={linea.id}>
                <LineaCotizacionForm
                  modo="edicion"
                  linea={linea}
                  servicios={servicios}
                  proveedores={proveedores}
                  config={config}
                  onSubmit={(input) => void guardar(linea, input)}
                  onCancel={() => setEditandoId(null)}
                />
              </li>
            )
          }
          return (
            <li
              key={linea.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-lg p-3 ring-1 ring-foreground/10"
            >
              <div>
                <p className="text-ui-medium">{servicio?.nombre ?? linea.servicio_id}</p>
                {linea.descripcion ? (
                  <p className="mt-1 text-ui text-muted-foreground">{linea.descripcion}</p>
                ) : null}
                <p className="text-kicker text-muted-foreground">
                  {linea.costo_proveedor != null ? "Con proveedor" : "Sin proveedor"} · cantidad{" "}
                  {linea.cantidad} · {formatMoney(linea.total_linea_extendido)}
                </p>
              </div>
              {esBorrador ? (
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="xs" onClick={() => setEditandoId(linea.id)}>
                    Editar
                  </Button>
                  <Button type="button" variant="ghost" size="xs" onClick={() => void borrar(linea.id)}>
                    Borrar
                  </Button>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
      {esBorrador ? (
        <div>
          <p className="mb-2 text-sm font-medium">Nueva línea</p>
          <LineaCotizacionForm
            key={cotizacion.lineas.map((linea) => linea.id).join("|")}
            modo="alta"
            servicios={servicios}
            proveedores={proveedores}
            config={config}
            onSubmit={(input) => void agregar(input)}
          />
        </div>
      ) : null}
    </div>
  )
}
