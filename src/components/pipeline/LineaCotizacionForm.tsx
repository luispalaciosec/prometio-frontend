import { useEffect, useMemo, useState } from "react"

import { HistorialPreciosDialog } from "@/components/pipeline/HistorialPreciosDialog"
import { LineaCalculoVivo } from "@/components/pipeline/LineaCalculoVivo"
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
  servicio_id: string
  proveedor_id: string | null
  costo_proveedor: number | null
  margen_pct: number | null
  comision_agencia_pct: number | null
  cantidad: number
  descripcion: string | null
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

export function LineaCotizacionForm({
  modo,
  linea,
  servicios,
  proveedores,
  config,
  onSubmit,
  onCancel,
}: {
  modo: "alta" | "edicion"
  linea?: LineaCotizacion
  servicios: Servicio[]
  proveedores: Proveedor[]
  config: ConfiguracionGeneral | null
  onSubmit: (input: LineaCotizacionFormInput) => void
  onCancel?: () => void
}) {
  const caminoFijoConProveedor =
    modo === "edicion" ? linea?.costo_proveedor != null : null
  const [servicioId, setServicioId] = useState(linea?.servicio_id ?? "")
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
  const [cantidadRaw, setCantidadRaw] = useState(String(linea?.cantidad ?? 1))
  const [descripcion, setDescripcion] = useState(linea?.descripcion ?? "")

  const servicio = servicios.find((row) => row.id === servicioId)
  const precioDirecto = precioDirectoServicio(servicio)
  const costoParsed = parseOptionalNumber(costoRaw)
  const conProveedor =
    caminoFijoConProveedor ?? (costoParsed !== null && costoParsed !== "invalid")

  useEffect(() => {
    if (modo !== "alta" || !conProveedor) {
      return
    }
    const defaults = defaultsDeServicio(servicio, config)
    setMargenRaw((prev) => (prev.trim() === "" ? defaults.margen : prev))
    setComisionRaw((prev) => (prev.trim() === "" ? defaults.comision : prev))
  }, [modo, conProveedor, servicio, config])

  const calculo = useMemo(() => {
    if (!config) {
      return null
    }
    const cantidad = parseOptionalNumber(cantidadRaw)
    if (cantidad === "invalid" || cantidad == null || cantidad === 0) {
      /* cantidad 0 is valid number but useless; still calculate unit */
    }
    if (conProveedor) {
      const costo = parseOptionalNumber(costoRaw)
      const margen = parseOptionalNumber(margenRaw)
      const comision = parseOptionalNumber(comisionRaw)
      if (costo == null || costo === "invalid" || margen == null || margen === "invalid" || comision == null || comision === "invalid") {
        return null
      }
      return calcularLineaConProveedor(costo, margen, comision, config.tasa_impuesto_pct)
    }
    const precio = precioDirectoServicio(servicio)
    if (precio == null) {
      return null
    }
    return calcularLineaSinProveedor(precio, config.tasa_impuesto_pct)
  }, [config, conProveedor, costoRaw, margenRaw, comisionRaw, cantidadRaw, servicio])

  function submit() {
    const cantidad = parseOptionalNumber(cantidadRaw)
    if (cantidad === "invalid" || cantidad == null) {
      return
    }
    const descripcionLinea = descripcion.trim() ? descripcion.trim() : null
    if (conProveedor) {
      const costo = parseOptionalNumber(costoRaw)
      const margen = parseOptionalNumber(margenRaw)
      const comision = parseOptionalNumber(comisionRaw)
      if (costo == null || costo === "invalid" || margen == null || margen === "invalid" || comision == null || comision === "invalid") {
        return
      }
      onSubmit({
        servicio_id: servicioId,
        proveedor_id: proveedorId === SIN_PROVEEDOR ? null : proveedorId,
        costo_proveedor: costo,
        margen_pct: margen,
        comision_agencia_pct: comision,
        cantidad,
        descripcion: descripcionLinea,
      })
      return
    }
    onSubmit({
      servicio_id: servicioId,
      proveedor_id: null,
      costo_proveedor: null,
      margen_pct: null,
      comision_agencia_pct: null,
      cantidad,
      descripcion: descripcionLinea,
    })
  }

  const puedeEnviar =
    servicioId !== "" &&
    parseOptionalNumber(cantidadRaw) !== "invalid" &&
    parseOptionalNumber(cantidadRaw) != null &&
    (conProveedor
      ? parseOptionalNumber(costoRaw) != null &&
        parseOptionalNumber(costoRaw) !== "invalid" &&
        parseOptionalNumber(margenRaw) != null &&
        parseOptionalNumber(margenRaw) !== "invalid" &&
        parseOptionalNumber(comisionRaw) != null &&
        parseOptionalNumber(comisionRaw) !== "invalid"
      : precioDirecto != null) &&
    config != null

  return (
    <form
      className="grid gap-3 rounded-lg p-3 ring-1 ring-foreground/10"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="linea-descripcion">Descripción</Label>
        <Textarea
          id="linea-descripcion"
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
        />
        <p className="text-kicker">
          Opcional. Texto de esta cotización: si lo llenás, el PDF del cliente lo muestra en vez
          de la descripción del catálogo.
        </p>
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
            onChange={(event) => setCostoRaw(event.target.value)}
          />
          {modo === "alta" ? (
            <p className="text-kicker">
              Dejalo vacío para cotizar sin proveedor (precio directo del servicio). Cero es un
              costo válido, no es lo mismo que vacío.
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
              required
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
              required
              value={comisionRaw}
              onChange={(event) => setComisionRaw(event.target.value)}
            />
            <p className="text-kicker">
              El valor inicial es el mínimo del rango sugerido del servicio.
            </p>
          </div>
        </>
      ) : (
        <p className="text-ui text-muted-foreground">
          Precio directo:{" "}
          {precioDirecto != null ? precioDirecto : "este servicio no tiene un precio base al cliente"}.
          Margen y comisión no aplican.
        </p>
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
