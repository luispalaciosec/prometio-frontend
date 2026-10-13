import { Plus, Trash2 } from "lucide-react"

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
import { lineaBorradorVacia, type ContratoLineaBorrador } from "@/lib/contrato-lineas-borrador"
import { formatMoney } from "@/lib/costo-interno"
import type { CategoriaServicio } from "@/types/categoria-servicio"
import type { Servicio } from "@/types/servicio"

const A_MEDIDA = "__a_medida__"

export function ContratoLineasEditor({
  lineas,
  onChange,
  servicios,
  categorias,
  disabled,
}: {
  lineas: ContratoLineaBorrador[]
  onChange: (lineas: ContratoLineaBorrador[]) => void
  servicios: Servicio[]
  categorias: CategoriaServicio[]
  disabled?: boolean
}) {
  const serviciosActivos = servicios.filter((row) => row.estado === "activo")
  const total = lineas.reduce((sum, linea) => {
    const monto = Number(linea.monto.replace(",", "."))
    return Number.isFinite(monto) && monto > 0 ? sum + monto : sum
  }, 0)

  function actualizar(key: string, cambios: Partial<ContratoLineaBorrador>) {
    onChange(lineas.map((linea) => (linea.key === key ? { ...linea, ...cambios } : linea)))
  }

  return (
    <div className="space-y-3">
      {lineas.map((linea, index) => {
        const id = `contrato-linea-${linea.key}`
        return (
          <div key={linea.key} className="space-y-3 rounded-xl bg-muted/40 p-3 ring-1 ring-border">
            <div className="flex items-center justify-between gap-2">
              <p className="text-ui-medium">Línea {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || lineas.length === 1}
                onClick={() => onChange(lineas.filter((row) => row.key !== linea.key))}
                aria-label={`Quitar línea ${index + 1}`}
              >
                <Trash2 className="size-4" strokeWidth={1.75} aria-hidden />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor={`${id}-servicio`}>Servicio</Label>
                <Select
                  value={linea.servicio_id ?? A_MEDIDA}
                  disabled={disabled}
                  onValueChange={(value) => {
                    if (value === A_MEDIDA) {
                      actualizar(linea.key, { servicio_id: null })
                      return
                    }
                    const servicio = serviciosActivos.find((row) => row.id === value)
                    actualizar(linea.key, {
                      servicio_id: value,
                      categoria_servicio_id: null,
                      descripcion: linea.descripcion.trim() ? linea.descripcion : (servicio?.nombre ?? ""),
                    })
                  }}
                >
                  <SelectTrigger id={`${id}-servicio`}>
                    <SelectValue placeholder="Elegí un servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={A_MEDIDA}>A medida (sin catálogo)</SelectItem>
                    {serviciosActivos.map((servicio) => (
                      <SelectItem key={servicio.id} value={servicio.id}>
                        {servicio.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {linea.servicio_id ? null : (
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`${id}-categoria`}>Categoría</Label>
                  <Select
                    value={linea.categoria_servicio_id ?? undefined}
                    disabled={disabled}
                    onValueChange={(value) => actualizar(linea.key, { categoria_servicio_id: value })}
                  >
                    <SelectTrigger id={`${id}-categoria`}>
                      <SelectValue placeholder="Obligatoria si es a medida" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria.id} value={categoria.id}>
                          {categoria.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-end sm:gap-3">
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor={`${id}-descripcion`}>Descripción</Label>
                  <Input
                    id={`${id}-descripcion`}
                    value={linea.descripcion}
                    disabled={disabled}
                    onChange={(event) => actualizar(linea.key, { descripcion: event.target.value })}
                    placeholder="Gestión de redes, fee mensual"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:w-40">
                  <Label htmlFor={`${id}-monto`}>Subtotal mensual</Label>
                  <Input
                    id={`${id}-monto`}
                    inputMode="decimal"
                    value={linea.monto}
                    disabled={disabled}
                    onChange={(event) => actualizar(linea.key, { monto: event.target.value })}
                    placeholder="0.00"
                    className="text-right tabular-nums"
                  />
                </div>
              </div>
            </div>
          </div>
        )
      })}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onChange([...lineas, lineaBorradorVacia()])}
        >
          <Plus className="size-4" strokeWidth={1.75} aria-hidden />
          Agregar línea
        </Button>
        <p className="text-kicker">
          Subtotal mensual (sin IVA){" "}
          <span className="text-ui-medium tabular-nums text-foreground">{formatMoney(total)}</span>
        </p>
      </div>
    </div>
  )
}
