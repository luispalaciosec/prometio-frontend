import { useMemo, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { ProveedorQuickCreateDialog } from "@/components/proveedores/ProveedorQuickCreateDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchCombobox } from "@/components/ui/search-combobox"
import {
  addLineaCosto,
  deleteLineaCosto,
  updateLineaCosto,
} from "@/lib/api/cotizacion"
import { ApiError } from "@/lib/api-client"
import { formatMoney } from "@/lib/costo-interno"
import { parseOptionalNumber } from "@/lib/calculo-cotizacion"
import {
  etiquetaCostoLinea,
  lineaTieneDesgloseCostos,
  sumaCostosLinea,
} from "@/lib/linea-cotizacion-costos"
import type { LineaCotizacionCalculada, LineaCotizacionCosto } from "@/types/linea-cotizacion"
import type { Proveedor } from "@/types/proveedor"

const SIN_PROVEEDOR = "none"

type ModoCosto = "proveedor" | "texto"

type BorradorCosto = {
  modo: ModoCosto
  proveedorId: string
  descripcion: string
  montoRaw: string
}

function borradorVacio(): BorradorCosto {
  return { modo: "proveedor", proveedorId: SIN_PROVEEDOR, descripcion: "", montoRaw: "" }
}

function borradorDe(costo: LineaCotizacionCosto): BorradorCosto {
  if (costo.proveedor_id) {
    return {
      modo: "proveedor",
      proveedorId: costo.proveedor_id,
      descripcion: "",
      montoRaw: String(costo.monto),
    }
  }
  return {
    modo: "texto",
    proveedorId: SIN_PROVEEDOR,
    descripcion: costo.descripcion ?? "",
    montoRaw: String(costo.monto),
  }
}

function mensajeError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.detail
  }
  return error instanceof Error ? error.message : fallback
}

function payloadDe(borrador: BorradorCosto): {
  proveedor_id?: string | null
  descripcion?: string | null
  monto: number
} | null {
  const monto = parseOptionalNumber(borrador.montoRaw)
  if (monto == null || monto === "invalid" || monto < 0) {
    return null
  }
  if (borrador.modo === "proveedor") {
    if (borrador.proveedorId === SIN_PROVEEDOR) {
      return null
    }
    return { proveedor_id: borrador.proveedorId, descripcion: null, monto }
  }
  const descripcion = borrador.descripcion.trim()
  if (!descripcion) {
    return null
  }
  return { proveedor_id: null, descripcion, monto }
}

export function LineaCostosDesglose({
  cotizacionId,
  linea,
  proveedores,
  compacto = false,
  onLineaActualizada,
  onProveedorCreated,
}: {
  cotizacionId: string
  linea: LineaCotizacionCalculada
  proveedores: Proveedor[]
  compacto?: boolean
  onLineaActualizada: (linea: LineaCotizacionCalculada) => void
  onProveedorCreated?: (proveedor: Proveedor) => void
}) {
  const costos = linea.costos ?? []
  const [guardando, setGuardando] = useState(false)
  const [crearProveedorQuery, setCrearProveedorQuery] = useState<string | null>(null)
  const [agregando, setAgregando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [borrador, setBorrador] = useState<BorradorCosto>(borradorVacio)

  const proveedorOptions = useMemo(
    () =>
      proveedores
        .filter((row) => row.activo !== false)
        .map((row) => ({ value: row.id, label: row.nombre })),
    [proveedores],
  )

  const totalCostos =
    linea.costo_proveedor ?? sumaCostosLinea(costos)

  async function aplicarRespuesta(next: LineaCotizacionCalculada) {
    onLineaActualizada(next)
  }

  async function guardarNuevo() {
    const body = payloadDe(borrador)
    if (!body) {
      toast.error("Completá proveedor o descripción y un monto válido.")
      return
    }
    setGuardando(true)
    try {
      const next = await addLineaCosto(cotizacionId, linea.id, body)
      await aplicarRespuesta(next)
      setAgregando(false)
      setBorrador(borradorVacio())
      toast.success("Costo agregado.")
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo agregar el costo."))
    } finally {
      setGuardando(false)
    }
  }

  async function guardarEdicion(costoId: string) {
    const body = payloadDe(borrador)
    if (!body) {
      toast.error("Completá proveedor o descripción y un monto válido.")
      return
    }
    setGuardando(true)
    try {
      const next = await updateLineaCosto(cotizacionId, linea.id, costoId, body)
      await aplicarRespuesta(next)
      setEditandoId(null)
      setBorrador(borradorVacio())
      toast.success("Costo actualizado.")
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo actualizar el costo."))
    } finally {
      setGuardando(false)
    }
  }

  async function borrar(costoId: string) {
    setGuardando(true)
    try {
      const next = await deleteLineaCosto(cotizacionId, linea.id, costoId)
      await aplicarRespuesta(next)
      toast.success("Costo eliminado.")
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo eliminar el costo."))
    } finally {
      setGuardando(false)
    }
  }

  function formularioCosto({
    onGuardar,
    onCancelar,
  }: {
    onGuardar: () => void
    onCancelar: () => void
  }) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-background p-3">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={borrador.modo === "proveedor" ? "default" : "outline"}
            onClick={() => setBorrador((prev) => ({ ...prev, modo: "proveedor" }))}
          >
            Proveedor
          </Button>
          <Button
            type="button"
            size="sm"
            variant={borrador.modo === "texto" ? "default" : "outline"}
            onClick={() => setBorrador((prev) => ({ ...prev, modo: "texto" }))}
          >
            Descripción libre
          </Button>
        </div>
        {borrador.modo === "proveedor" ? (
          <SearchCombobox
            id={`costo-proveedor-${linea.id}`}
            label="Proveedor"
            placeholder="Buscar proveedor…"
            value={borrador.proveedorId}
            onChange={(value) => setBorrador((prev) => ({ ...prev, proveedorId: value }))}
            options={proveedorOptions}
            clearSelectionValue={SIN_PROVEEDOR}
            showClearSelection={borrador.proveedorId !== SIN_PROVEEDOR}
            onCreateNew={(q) => setCrearProveedorQuery(q)}
            createNewLabel={(q) => `Crear proveedor «${q}»`}
          />
        ) : (
          <div className="flex flex-col gap-2">
            <Label htmlFor={`costo-desc-${linea.id}`}>Descripción</Label>
            <Input
              id={`costo-desc-${linea.id}`}
              value={borrador.descripcion}
              onChange={(event) =>
                setBorrador((prev) => ({ ...prev, descripcion: event.target.value }))
              }
              placeholder="Ej. Transporte, fee plataforma…"
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor={`costo-monto-${linea.id}`}>Monto</Label>
          <Input
            id={`costo-monto-${linea.id}`}
            type="number"
            step="0.01"
            min="0"
            value={borrador.montoRaw}
            onChange={(event) => setBorrador((prev) => ({ ...prev, montoRaw: event.target.value }))}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={guardando} onClick={() => void onGuardar()}>
            Guardar
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={guardando} onClick={onCancelar}>
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  if (!lineaTieneDesgloseCostos(linea) && costos.length === 0) {
    return null
  }

  return (
    <div className={compacto ? "mt-2 space-y-2" : "space-y-3"}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-kicker text-muted-foreground">Costos internos (solo PDF interno)</p>
        <p className="text-ui-medium tabular-nums">
          Total costos: {formatMoney(totalCostos)}
        </p>
      </div>
      <ul className="divide-y divide-border rounded-lg border border-border bg-background">
        {costos.map((costo) =>
          editandoId === costo.id ? (
            <li key={costo.id} className="p-3">
              {formularioCosto({
                onGuardar: () => void guardarEdicion(costo.id),
                onCancelar: () => {
                  setEditandoId(null)
                  setBorrador(borradorVacio())
                },
              })}
            </li>
          ) : (
            <li
              key={costo.id}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-ui-medium truncate">{etiquetaCostoLinea(costo)}</p>
                {costo.descripcion && costo.proveedor_nombre ? (
                  <p className="text-kicker text-muted-foreground">{costo.descripcion}</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-ui tabular-nums">{formatMoney(costo.monto)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Editar costo"
                  disabled={guardando}
                  onClick={() => {
                    setEditandoId(costo.id)
                    setAgregando(false)
                    setBorrador(borradorDe(costo))
                  }}
                >
                  <Pencil className="size-4" strokeWidth={1.75} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive"
                  aria-label="Eliminar costo"
                  disabled={guardando}
                  onClick={() => void borrar(costo.id)}
                >
                  <Trash2 className="size-4" strokeWidth={1.75} />
                </Button>
              </div>
            </li>
          ),
        )}
      </ul>
      {agregando ? (
        formularioCosto({
          onGuardar: () => void guardarNuevo(),
          onCancelar: () => {
            setAgregando(false)
            setBorrador(borradorVacio())
          },
        })
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={guardando || editandoId != null}
          onClick={() => {
            setAgregando(true)
            setEditandoId(null)
            setBorrador(borradorVacio())
          }}
        >
          Agregar otro costo
        </Button>
      )}
      <ProveedorQuickCreateDialog
        open={crearProveedorQuery != null}
        nombreInicial={crearProveedorQuery ?? ""}
        onOpenChange={(next) => {
          if (!next) {
            setCrearProveedorQuery(null)
          }
        }}
        onCreated={(row) => {
          onProveedorCreated?.(row)
          setBorrador((prev) => ({ ...prev, proveedorId: row.id }))
          setCrearProveedorQuery(null)
        }}
      />
    </div>
  )
}
