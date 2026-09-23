import { useEffect, useState } from "react"
import { toast } from "sonner"

import { CotizacionAsistenteLineas } from "@/components/pipeline/CotizacionAsistenteLineas"
import { CotizacionEstadoBadge } from "@/components/pipeline/CotizacionEstadoBadge"
import { CotizacionPdfAcciones } from "@/components/pipeline/CotizacionPdfAcciones"
import { CotizacionTransiciones } from "@/components/pipeline/CotizacionTransiciones"
import { DocumentoAlcanceIndicador } from "@/components/pipeline/DocumentoAlcanceEstadoBadge"
import { DocumentoAlcanceRequisitoAviso } from "@/components/pipeline/DocumentoAlcanceRequisitoAviso"
import { DocumentoAlcanceSection } from "@/components/pipeline/DocumentoAlcanceSection"
import { LineaCotizacionForm, type LineaCotizacionFormInput } from "@/components/pipeline/LineaCotizacionForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api-client"
import { formatMoney } from "@/lib/costo-interno"
import { getSugerenciaPrecio } from "@/lib/config-api"
import {
  createLinea,
  deleteLinea,
  ejecutarTransicion,
  getPreviewAprobacion,
  updateLinea,
  type AccionCotizacion,
} from "@/lib/api/cotizacion"
import type { ConfiguracionGeneral } from "@/types/configuracion-general"
import type { CotizacionConLineas } from "@/types/cotizacion"
import type { DocumentoAlcance } from "@/types/documento-alcance"
import type { LineaCotizacion } from "@/types/linea-cotizacion"
import type { Perfil } from "@/types/perfil"
import type { Proveedor } from "@/types/proveedor"
import type { Servicio } from "@/types/servicio"

function tituloLinea(linea: LineaCotizacion, servicios: Servicio[]): string {
  if (linea.descripcion?.trim()) {
    return linea.descripcion.trim()
  }
  if (linea.servicio_id) {
    return servicios.find((row) => row.id === linea.servicio_id)?.nombre ?? "Servicio"
  }
  return "Ítem a medida"
}

function mensajeError(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status === 422) {
    return error.detail
  }
  return error instanceof Error ? error.message : fallback
}

export function CotizacionConstructor({
  cotizacion,
  perfil,
  ejecutivoId,
  servicios,
  proveedores,
  config,
  documentoIdInicial,
  documentos,
  onChange,
  onDocumentosChange,
}: {
  cotizacion: CotizacionConLineas
  perfil: Perfil
  ejecutivoId: string
  servicios: Servicio[]
  proveedores: Proveedor[]
  config: ConfiguracionGeneral | null
  documentoIdInicial?: string | null
  documentos?: DocumentoAlcance[]
  onChange: () => Promise<void>
  onDocumentosChange?: (docs: DocumentoAlcance[]) => void
}) {
  const esBorrador = cotizacion.estado === "borrador"
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [transicionPendiente, setTransicionPendiente] = useState(false)
  const [previewAprobacion, setPreviewAprobacion] = useState<boolean | null>(null)

  const firmaLineas = cotizacion.lineas.map((linea) => linea.id).join("|")

  useEffect(() => {
    if (!esBorrador) {
      setPreviewAprobacion(cotizacion.requiere_aprobacion)
      return
    }
    let cancelled = false
    void getPreviewAprobacion(cotizacion.id)
      .then((row) => {
        if (!cancelled) {
          setPreviewAprobacion(row.requiere_aprobacion)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewAprobacion(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [cotizacion.id, esBorrador, firmaLineas, cotizacion.requiere_aprobacion])

  async function agregar(input: LineaCotizacionFormInput) {
    try {
      await createLinea({
        perfil,
        cotizacion_id: cotizacion.id,
        ...input,
      })
      await onChange()
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo agregar la línea."))
    }
  }

  async function guardar(linea: LineaCotizacion, input: LineaCotizacionFormInput) {
    try {
      if (linea.costo_proveedor != null) {
        if (input.costo_proveedor == null) {
          toast.error("Esta línea es con proveedor: no se puede vaciar el costo.")
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
          precio_venta_base_manual: input.precio_venta_base_manual,
          justificacion_precio: input.justificacion_precio,
        })
      }
      setEditandoId(null)
      await onChange()
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo guardar la línea."))
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

  async function avisoPrecioBajoAlEnviar() {
    for (const linea of cotizacion.lineas) {
      if (linea.servicio_id == null || linea.costo_proveedor != null) {
        continue
      }
      const precio =
        linea.precio_venta_base_manual ?? linea.precio_base_cliente_aplicado ?? linea.precio_venta_base
      try {
        const ref = await getSugerenciaPrecio(linea.servicio_id, 12)
        if (
          ref.precio_sugerido_min != null &&
          precio != null &&
          precio < ref.precio_sugerido_min
        ) {
          toast.warning(
            `«${tituloLinea(linea, servicios)}» está por debajo del mínimo histórico (${formatMoney(ref.precio_sugerido_min)}).`,
          )
          return
        }
      } catch {
        /* referencia opcional */
      }
    }
  }

  async function transicionar(accion: AccionCotizacion) {
    setTransicionPendiente(true)
    try {
      if (accion === "enviar") {
        await avisoPrecioBajoAlEnviar()
      }
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
        {previewAprobacion ? (
          <Badge variant="warning">Pedirá aprobación al enviar</Badge>
        ) : previewAprobacion === false && esBorrador ? (
          <Badge variant="outline">Sin aprobación por descuento</Badge>
        ) : null}
        <DocumentoAlcanceIndicador docs={documentos} />
      </div>
      <DocumentoAlcanceRequisitoAviso
        requiereDocumento={cotizacion.requiere_documento_alcance === true}
        documentos={documentos}
      />
      <div className="space-y-3 surface-card p-4">
        <div>
          <p className="text-ui-medium">Cambiar estado</p>
          <p className="mt-1 text-kicker">
            {esBorrador
              ? cotizacion.requiere_documento_alcance
                ? "Cuando las líneas y el Documento de Alcance aprobado estén listos, enviá la cotización."
                : "Cuando las líneas estén listas, enviá la cotización. Si hay un descuento grande, pasa a preparación para que la apruebe un supervisor."
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
          const servicio = linea.servicio_id
            ? servicios.find((row) => row.id === linea.servicio_id)
            : undefined
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
              className="surface-muted flex flex-wrap items-start justify-between gap-2 p-3"
            >
              <div>
                <p className="text-ui-medium">{tituloLinea(linea, servicios)}</p>
                {servicio && linea.descripcion ? (
                  <p className="mt-1 text-ui text-muted-foreground">{linea.descripcion}</p>
                ) : null}
                <p className="text-kicker text-muted-foreground">
                  {linea.costo_proveedor != null
                    ? "Con proveedor"
                    : linea.servicio_id
                      ? "Sin proveedor"
                      : "A medida"}
                  {linea.precio_venta_base_manual != null ? " · precio ajustado" : ""}
                  {" · cantidad "}
                  {linea.cantidad} · {formatMoney(linea.total_linea_extendido)}
                </p>
                {linea.justificacion_precio ? (
                  <p className="text-micro text-muted-foreground">{linea.justificacion_precio}</p>
                ) : null}
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
        <>
          <CotizacionAsistenteLineas
            cotizacionId={cotizacion.id}
            perfil={perfil}
            onLineaAgregada={onChange}
          />
          <div>
            <p className="mb-2 text-sm font-medium">Nueva línea</p>
            <LineaCotizacionForm
              key={firmaLineas}
              modo="alta"
              servicios={servicios}
              proveedores={proveedores}
              config={config}
              onSubmit={(input) => void agregar(input)}
            />
          </div>
        </>
      ) : null}
      <DocumentoAlcanceSection
        cotizacionId={cotizacion.id}
        perfil={perfil}
        config={config}
        requiereDocumento={cotizacion.requiere_documento_alcance === true}
        documentoIdInicial={documentoIdInicial}
        onListaChange={onDocumentosChange}
      />
    </div>
  )
}
