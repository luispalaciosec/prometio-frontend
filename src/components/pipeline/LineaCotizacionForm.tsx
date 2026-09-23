import { useEffect, useMemo, useState } from "react"

import { HistorialPreciosDialog } from "@/components/pipeline/HistorialPreciosDialog"
import { LineaCalculoVivo } from "@/components/pipeline/LineaCalculoVivo"
import { SugerenciaPrecioPanel } from "@/components/pipeline/SugerenciaPrecioPanel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  calcularLineaConProveedor,
  calcularLineaSinProveedor,
  parseOptionalNumber,
  precioDirectoServicio,
} from "@/lib/calculo-cotizacion"
import type { ConfiguracionGeneral } from "@/types/configuracion-general"
import type { LineaCotizacion } from "@/types/linea-cotizacion"
import type { Proveedor } from "@/types/proveedor"
import type { Servicio } from "@/types/servicio"

const SIN_PROVEEDOR = "none"

export type LineaCotizacionFormInput = {
  servicio_id: string | null
  proveedor_id: string | null
  costo_proveedor: number | null
  margen_pct: number | null
  comision_agencia_pct: number | null
  cantidad: number
  descripcion: string | null
  precio_venta_base_manual: number | null
  justificacion_precio: string | null
}

/** Precarga del formulario de alta desde POST .../sugerir-lineas */
export type LineaFormPrefillAlta = {
  sinCatalogo: boolean
  servicio_id: string | null
  descripcion: string
  cantidad: number
  caminoProveedor: boolean
  justificacion_precio: string
  motivo: string
}

export function prefillDesdeSugerencia(row: {
  servicio_id: string | null
  servicio_nombre_sugerido: string
  cantidad: number
  descripcion: string
  requiere_proveedor: boolean
  motivo: string
}): LineaFormPrefillAlta {
  const sinCatalogo = row.servicio_id == null
  const descripcion =
    row.descripcion.trim() || row.servicio_nombre_sugerido.trim() || "Ítem a medida"
  return {
    sinCatalogo,
    servicio_id: row.servicio_id,
    descripcion,
    cantidad: row.cantidad,
    caminoProveedor: row.requiere_proveedor,
    justificacion_precio: sinCatalogo && !row.requiere_proveedor ? row.motivo : "",
    motivo: row.motivo,
  }
}

function defaultsDeServicio(
  servicio: Servicio | undefined,
  config: ConfiguracionGeneral | null,
) {
  return {
    margen: String(
      servicio?.margen_default_pct ?? config?.margen_agencia_default_pct ?? "",
    ),
    comision: String(
      servicio?.comision_sugerida_min_pct ?? config?.comision_agencia_default_min_pct ?? "",
    ),
  }
}

function numeroOpcional(raw: string): number | null {
  const parsed = parseOptionalNumber(raw)
  if (parsed === "invalid" || parsed == null) {
    return null
  }
  return parsed
}

export function LineaCotizacionForm({
  modo,
  linea,
  prefillAlta,
  notaContexto,
  servicios,
  proveedores,
  config,
  onSubmit,
  onCancel,
}: {
  modo: "alta" | "edicion"
  linea?: LineaCotizacion
  prefillAlta?: LineaFormPrefillAlta
  notaContexto?: string
  servicios: Servicio[]
  proveedores: Proveedor[]
  config: ConfiguracionGeneral | null
  onSubmit: (input: LineaCotizacionFormInput) => void
  onCancel?: () => void
}) {
  const esEdicionSinServicio = modo === "edicion" && linea?.servicio_id == null
  const [sinCatalogo, setSinCatalogo] = useState(
    esEdicionSinServicio || prefillAlta?.sinCatalogo === true,
  )
  const [caminoProveedorForzado, setCaminoProveedorForzado] = useState(
    prefillAlta?.caminoProveedor ?? false,
  )
  const caminoFijoConProveedor =
    modo === "edicion" ? linea?.costo_proveedor != null : null
  const [servicioId, setServicioId] = useState(
    linea?.servicio_id ?? prefillAlta?.servicio_id ?? "",
  )
  const [proveedorId, setProveedorId] = useState(linea?.proveedor_id ?? SIN_PROVEEDOR)
  const [costoRaw, setCostoRaw] = useState(
    linea?.costo_proveedor != null ? String(linea.costo_proveedor) : "",
  )
  const [margenRaw, setMargenRaw] = useState(
    linea?.margen_pct != null ? String(linea.margen_pct) : "",
  )
  const [comisionRaw, setComisionRaw] = useState(
    linea?.comision_agencia_pct != null ? String(linea.comision_agencia_pct) : "",
  )
  const [cantidadRaw, setCantidadRaw] = useState(
    String(linea?.cantidad ?? prefillAlta?.cantidad ?? 1),
  )
  const [descripcion, setDescripcion] = useState(
    linea?.descripcion ?? prefillAlta?.descripcion ?? "",
  )
  const [ajustarPrecio, setAjustarPrecio] = useState(
    (linea?.precio_venta_base_manual != null && linea.costo_proveedor == null) ||
      Boolean(prefillAlta?.sinCatalogo && !prefillAlta.caminoProveedor),
  )
  const [precioManualRaw, setPrecioManualRaw] = useState(
    linea?.precio_venta_base_manual != null ? String(linea.precio_venta_base_manual) : "",
  )
  const [justificacion, setJustificacion] = useState(
    linea?.justificacion_precio ?? prefillAlta?.justificacion_precio ?? "",
  )

  const servicio = servicios.find((row) => row.id === servicioId)
  const precioDirecto = precioDirectoServicio(servicio)
  const costoParsed = parseOptionalNumber(costoRaw)
  const conProveedor =
    caminoFijoConProveedor ??
    (caminoProveedorForzado || (costoParsed !== null && costoParsed !== "invalid"))

  useEffect(() => {
    if (modo !== "alta" || !conProveedor) {
      return
    }
    const defaults = defaultsDeServicio(sinCatalogo ? undefined : servicio, config)
    setMargenRaw((prev) => (prev.trim() === "" ? defaults.margen : prev))
    setComisionRaw((prev) => (prev.trim() === "" ? defaults.comision : prev))
  }, [modo, conProveedor, sinCatalogo, servicio, config])

  const precioSinProveedor = useMemo(() => {
    if (ajustarPrecio || sinCatalogo) {
      const manual = parseOptionalNumber(precioManualRaw)
      if (manual != null && manual !== "invalid") {
        return manual
      }
      return null
    }
    return precioDirecto
  }, [ajustarPrecio, sinCatalogo, precioManualRaw, precioDirecto])

  const calculo = useMemo(() => {
    if (!config) {
      return null
    }
    if (conProveedor) {
      const costo = parseOptionalNumber(costoRaw)
      const margen = parseOptionalNumber(margenRaw)
      const comision = parseOptionalNumber(comisionRaw)
      if (costo == null || costo === "invalid") {
        return null
      }
      const margenEfectivo = margen === "invalid" || margen == null ? 0 : margen
      const comisionEfectivo = comision === "invalid" || comision == null ? 0 : comision
      return calcularLineaConProveedor(
        costo,
        margenEfectivo,
        comisionEfectivo,
        config.tasa_impuesto_pct,
      )
    }
    if (precioSinProveedor == null) {
      return null
    }
    return calcularLineaSinProveedor(precioSinProveedor, config.tasa_impuesto_pct)
  }, [config, conProveedor, costoRaw, margenRaw, comisionRaw, precioSinProveedor])

  function submit() {
    const cantidad = parseOptionalNumber(cantidadRaw)
    if (cantidad === "invalid" || cantidad == null) {
      return
    }
    const descripcionLinea = descripcion.trim() ? descripcion.trim() : null
    const usaManual = (sinCatalogo && !conProveedor) || ajustarPrecio
    const precioManual = usaManual ? numeroOpcional(precioManualRaw) : null
    const justificacionLinea = usaManual && justificacion.trim() ? justificacion.trim() : null

    if (conProveedor) {
      const costo = parseOptionalNumber(costoRaw)
      if (costo == null || costo === "invalid") {
        return
      }
      onSubmit({
        servicio_id: sinCatalogo ? null : servicioId || null,
        proveedor_id: proveedorId === SIN_PROVEEDOR ? null : proveedorId,
        costo_proveedor: costo,
        margen_pct: numeroOpcional(margenRaw),
        comision_agencia_pct: numeroOpcional(comisionRaw),
        cantidad,
        descripcion: descripcionLinea,
        precio_venta_base_manual: null,
        justificacion_precio: null,
      })
      return
    }

    onSubmit({
      servicio_id: sinCatalogo ? null : servicioId || null,
      proveedor_id: null,
      costo_proveedor: null,
      margen_pct: null,
      comision_agencia_pct: null,
      cantidad,
      descripcion: descripcionLinea,
      precio_venta_base_manual: usaManual ? precioManual : null,
      justificacion_precio: usaManual ? justificacionLinea : null,
    })
  }

  const descripcionOk = sinCatalogo ? descripcion.trim() !== "" : true
  const servicioOk = sinCatalogo || servicioId !== ""
  const manualOk =
    !((sinCatalogo && !conProveedor) || ajustarPrecio) ||
    (numeroOpcional(precioManualRaw) != null && justificacion.trim() !== "")
  const catalogoPrecioOk =
    sinCatalogo || conProveedor || ajustarPrecio || precioDirecto != null

  const puedeEnviar =
    servicioOk &&
    descripcionOk &&
    manualOk &&
    catalogoPrecioOk &&
    parseOptionalNumber(cantidadRaw) !== "invalid" &&
    parseOptionalNumber(cantidadRaw) != null &&
    (conProveedor
      ? parseOptionalNumber(costoRaw) != null && parseOptionalNumber(costoRaw) !== "invalid"
      : precioSinProveedor != null) &&
    config != null

  return (
    <form
      className="surface-muted grid gap-3 p-3"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      {notaContexto ? (
        <div className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2">
          <p className="text-ui-medium text-foreground">Contexto de la sugerencia</p>
          <p className="mt-1 text-kicker">{notaContexto}</p>
        </div>
      ) : null}
      {modo === "alta" ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={sinCatalogo ? "outline" : "default"}
            onClick={() => {
              setSinCatalogo(false)
              setCaminoProveedorForzado(false)
            }}
          >
            Del catálogo
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sinCatalogo ? "default" : "outline"}
            onClick={() => {
              setSinCatalogo(true)
              setServicioId("")
              setCaminoProveedorForzado(false)
            }}
          >
            No está en el catálogo
          </Button>
        </div>
      ) : null}

      {!sinCatalogo ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="linea-servicio">Servicio</Label>
          <Select
            value={servicioId || undefined}
            onValueChange={setServicioId}
            disabled={modo === "edicion"}
          >
            <SelectTrigger id="linea-servicio">
              <SelectValue placeholder="Selecciona un servicio" />
            </SelectTrigger>
            <SelectContent>
              {servicios
                .filter((row) => row.estado === "activo")
                .map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.nombre}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {servicio ? (
            <HistorialPreciosDialog
              servicioId={servicio.id}
              servicioNombre={servicio.nombre}
              mapeado={Boolean(servicio.contifico_producto_id)}
            />
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="linea-descripcion">
          Descripción{sinCatalogo ? " (obligatoria)" : ""}
        </Label>
        <Textarea
          id="linea-descripcion"
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
          required={sinCatalogo}
          placeholder={
            sinCatalogo
              ? "Nombre del ítem tal como lo verá el cliente"
              : "Opcional — reemplaza la descripción del catálogo en el PDF"
          }
        />
      </div>

      {caminoFijoConProveedor === false ? null : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="linea-costo">Costo del proveedor</Label>
          <Input
            id="linea-costo"
            type="number"
            step="0.01"
            required={caminoFijoConProveedor === true}
            value={costoRaw}
            onChange={(event) => {
              const value = event.target.value
              setCostoRaw(value)
              if (value.trim() === "" && caminoProveedorForzado) {
                setCaminoProveedorForzado(true)
              }
            }}
          />
          {modo === "alta" ? (
            <p className="text-kicker">
              {caminoProveedorForzado
                ? "Completá el costo del proveedor. Margen y comisión vacíos usan defaults globales."
                : "Dejalo vacío para cotizar sin proveedor. Con costo usás margen y comisión (vacíos = defaults globales)."}
            </p>
          ) : null}
        </div>
      )}

      {conProveedor ? (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="linea-proveedor">Proveedor</Label>
            <Select value={proveedorId} onValueChange={setProveedorId}>
              <SelectTrigger id="linea-proveedor">
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SIN_PROVEEDOR}>Sin proveedor nombrado</SelectItem>
                {proveedores.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="linea-margen">Margen de agencia (%)</Label>
            <Input
              id="linea-margen"
              type="number"
              step="0.1"
              value={margenRaw}
              onChange={(event) => setMargenRaw(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="linea-comision">Comisión de agencia (%)</Label>
            <Input
              id="linea-comision"
              type="number"
              step="0.1"
              value={comisionRaw}
              onChange={(event) => setComisionRaw(event.target.value)}
            />
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {!sinCatalogo && precioDirecto != null ? (
            <p className="text-ui text-muted-foreground">
              Precio de catálogo: {precioDirecto}. Podés ajustarlo con motivo registrado.
            </p>
          ) : null}
          {!sinCatalogo ? (
            <label className="flex cursor-pointer items-center gap-2 text-kicker">
              <input
                type="checkbox"
                checked={ajustarPrecio}
                onChange={(event) => setAjustarPrecio(event.target.checked)}
              />
              Ajustar precio (fuera del catálogo)
            </label>
          ) : null}
          {(sinCatalogo || ajustarPrecio || precioDirecto == null) && !conProveedor ? (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="linea-precio-manual">Precio base al cliente</Label>
                <Input
                  id="linea-precio-manual"
                  type="number"
                  step="0.01"
                  required
                  value={precioManualRaw}
                  onChange={(event) => setPrecioManualRaw(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="linea-justificacion">Motivo del precio</Label>
                <Textarea
                  id="linea-justificacion"
                  required
                  value={justificacion}
                  onChange={(event) => setJustificacion(event.target.value)}
                  placeholder="Ej. urgencia, volumen, alcance acotado…"
                />
              </div>
            </>
          ) : null}
          {servicioId && !conProveedor ? (
            <SugerenciaPrecioPanel servicioId={servicioId} precioActual={precioSinProveedor} />
          ) : null}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="linea-cantidad">Cantidad</Label>
        <Input
          id="linea-cantidad"
          type="number"
          step="1"
          min="0"
          value={cantidadRaw}
          onChange={(event) => setCantidadRaw(event.target.value)}
        />
      </div>
      <LineaCalculoVivo calculo={calculo} conProveedor={conProveedor} />
      {!config ? (
        <p className="text-kicker text-destructive">
          Falta la tasa de impuesto en Márgenes e impuestos. No se puede calcular.
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={!puedeEnviar}>
          {modo === "alta" ? "Agregar línea" : "Guardar"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  )
}
