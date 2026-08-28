import type { ModeloCobro, Servicio, ServicioFase } from "@/types/servicio"
import { MODELO_COBRO_LABELS } from "@/types/servicio"
import {
  CANTIDAD_ESTIMACION_LABELS,
  type TarifaInterna,
} from "@/types/tarifa-interna"
import type { TipoDocumento } from "@/types/tipo-documento"
import type { ConfiguracionGeneral } from "@/types/configuracion-general"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  HORAS_LABORALES_MES_DEFAULT,
  costoInterno,
  etiquetaCostoTarifa,
  formatMoney,
  modeloTarifa,
} from "@/lib/costo-interno"

const SIN_CATEGORIA = "__none__"

function CampoAyuda({ children }: { children: string }) {
  return <p className="text-kicker">{children}</p>
}

export type WizardPaso = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export function pasosVisibles(
  draft: Pick<Servicio, "modelo_cobro" | "tiene_fases">,
): WizardPaso[] {
  const pasos: WizardPaso[] = [1, 2, 3]
  if (draft.modelo_cobro === "fee_fijo" || draft.modelo_cobro === "fee_recurrente") {
    pasos.push(4)
  }
  if (draft.tiene_fases) {
    pasos.push(5)
  }
  pasos.push(6, 7, 8)
  return pasos
}

export const PASO_TITULO: Record<WizardPaso, string> = {
  1: "Datos básicos",
  2: "Modelo de cobro",
  3: "Equipo y costeo",
  4: "Configuración de fee",
  5: "Fases",
  6: "Márgenes por defecto",
  7: "Documentos requeridos",
  8: "Revisión y publicación",
}

type SetDraft = (updater: (prev: Servicio) => Servicio) => void

export function PasoDatosBasicos({
  draft,
  setDraft,
  categorias,
}: {
  draft: Servicio
  setDraft: SetDraft
  categorias: string[]
}) {
  const opciones = [...categorias]
  if (draft.categoria && !opciones.includes(draft.categoria)) {
    opciones.push(draft.categoria)
  }
  opciones.sort((a, b) => a.localeCompare(b, "es"))

  return (
    <div className="grid max-w-lg gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          value={draft.nombre}
          onChange={(event) =>
            setDraft((prev) => ({ ...prev, nombre: event.target.value }))
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="categoria">Categoría</Label>
        <Select
          value={draft.categoria ?? SIN_CATEGORIA}
          onValueChange={(value) =>
            setDraft((prev) => ({
              ...prev,
              categoria: value === SIN_CATEGORIA ? null : value,
            }))
          }
        >
          <SelectTrigger id="categoria">
            <SelectValue placeholder="Sin categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SIN_CATEGORIA}>Sin categoría</SelectItem>
            {opciones.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <CampoAyuda>
          {opciones.length === 0
            ? "Todavía no hay categorías en el catálogo. Este servicio queda sin categoría."
            : "Solo las categorías que ya existen en servicios cargados. No se escribe una nueva."}
        </CampoAyuda>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          value={draft.descripcion ?? ""}
          onChange={(event) =>
            setDraft((prev) => ({
              ...prev,
              descripcion: event.target.value || null,
            }))
          }
        />
        <CampoAyuda>Qué incluye el servicio, en una o dos frases. Sale en la cotización.</CampoAyuda>
      </div>
      <label className="flex items-start gap-2 text-ui">
        <Checkbox
          checked={draft.tiene_fases}
          onCheckedChange={(checked) =>
            setDraft((prev) => ({ ...prev, tiene_fases: checked === true }))
          }
        />
        <span>
          Se entrega en fases
          <span className="mt-1 block text-kicker">
            Hitos de pago y entregas parciales. Independiente del modelo de cobro.
          </span>
        </span>
      </label>
    </div>
  )
}

export function PasoModeloCobro({
  draft,
  setDraft,
}: {
  draft: Servicio
  setDraft: SetDraft
}) {
  return (
    <RadioGroup
      value={draft.modelo_cobro}
      onValueChange={(value) =>
        setDraft((prev) => ({ ...prev, modelo_cobro: value as ModeloCobro }))
      }
      className="max-w-md gap-3"
    >
      {(
        [
          ["por_hora", "El cliente paga las horas reales del equipo."],
          ["fee_fijo", "Un monto único, aunque el trabajo dure más de un mes."],
          ["fee_recurrente", "Un monto que se cobra cada ciclo (mes, en general) mientras dure el contrato."],
        ] as const
      ).map(([value, ayuda]) => (
        <label key={value} className="flex items-start gap-2 text-ui">
          <RadioGroupItem value={value} id={value} className="mt-0.5" />
          <span>
            {MODELO_COBRO_LABELS[value]}
            <span className="mt-1 block text-kicker">{ayuda}</span>
          </span>
        </label>
      ))}
    </RadioGroup>
  )
}

export function PasoEquipoCosteo({
  draft,
  setDraft,
  tarifas,
  horasLaboralesMes = HORAS_LABORALES_MES_DEFAULT,
}: {
  draft: Servicio
  setDraft: SetDraft
  tarifas: TarifaInterna[]
  horasLaboralesMes?: number
}) {
  const estimacion = draft.estimacion_interna_por_rol ?? {}
  const usadas = new Set(Object.keys(estimacion))
  const disponibles = tarifas.filter((row) => !usadas.has(row.id))
  const total = costoInterno(estimacion, tarifas, horasLaboralesMes)

  function setCantidad(id: string, cantidad: number) {
    setDraft((prev) => {
      const next = { ...(prev.estimacion_interna_por_rol ?? {}) }
      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        delete next[id]
      } else {
        next[id] = { cantidad }
      }
      return { ...prev, estimacion_interna_por_rol: next }
    })
  }

  return (
    <div className="space-y-4">
      {Object.entries(estimacion).map(([id, item]) => {
        const tarifa = tarifas.find((row) => row.id === id)
        const modelo = tarifa ? modeloTarifa(tarifa) : "por_hora"
        return (
          <div key={id} className="flex items-end gap-3">
            <div className="flex-1">
              <p className="text-ui-medium">{tarifa?.nombre_rol ?? id}</p>
              <p className="text-kicker text-muted-foreground">
                {tarifa ? etiquetaCostoTarifa(tarifa) : ""}
              </p>
            </div>
            <div className="w-28">
              <Label htmlFor={`cantidad-${id}`}>{CANTIDAD_ESTIMACION_LABELS[modelo]}</Label>
              <Input
                id={`cantidad-${id}`}
                type="number"
                min="0"
                step={modelo === "por_sueldo" ? "1" : "0.5"}
                max={modelo === "por_sueldo" ? 100 : undefined}
                value={item.cantidad}
                onChange={(event) => setCantidad(id, Number(event.target.value))}
              />
            </div>
            <Button variant="ghost" onClick={() => setCantidad(id, 0)}>
              Quitar
            </Button>
          </div>
        )
      })}
      {draft.modelo_cobro === "fee_recurrente" ? (
        <CampoAyuda>
          {`De las ${horasLaboralesMes} horas laborales del mes, cada rol aporta al costo interno del fee: horas, % del mes o veces, según el modelo de su tarifa. Nunca se costea por persona nombrada.`}
        </CampoAyuda>
      ) : (
        <CampoAyuda>
          La cantidad se interpreta según el modelo de cada tarifa: horas, % del mes (0–100) o
          veces. El costo interno usa la tarifa del rol, nunca una persona nombrada.
        </CampoAyuda>
      )}
      {disponibles.length > 0 ? (
        <Select onValueChange={(id) => setCantidad(id, 1)}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Agregar rol" />
          </SelectTrigger>
          <SelectContent>
            {disponibles.map((row) => (
              <SelectItem key={row.id} value={row.id}>
                {row.nombre_rol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <p className="text-ui">
        Costo interno en vivo:{" "}
        <span className="text-ui-medium">{formatMoney(total)}</span>
      </p>
    </div>
  )
}

export function PasoConfigFee({
  draft,
  setDraft,
}: {
  draft: Servicio
  setDraft: SetDraft
}) {
  const fee = draft.config_fee ?? {
    monto: 0,
    duracion_minima: 0,
    ciclo_renovacion: "",
  }

  function patch(partial: Partial<typeof fee>) {
    setDraft((prev) => ({
      ...prev,
      config_fee: { ...fee, ...partial },
    }))
  }

  return (
    <div className="grid max-w-lg gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="monto">Monto del fee</Label>
        <Input
          id="monto"
          type="number"
          min="0"
          value={fee.monto}
          onChange={(event) => patch({ monto: Number(event.target.value) })}
        />
        <CampoAyuda>Importe en USD. Cómo entra al cobro está pendiente de definir junto con el resto del fee.</CampoAyuda>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="duracion_minima">duracion_minima</Label>
        <Input
          id="duracion_minima"
          type="number"
          min="0"
          value={fee.duracion_minima}
          onChange={(event) => patch({ duracion_minima: Number(event.target.value) })}
        />
        <CampoAyuda>Configuración pendiente de definir. La unidad depende de ciclo_renovacion.</CampoAyuda>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ciclo_renovacion">ciclo_renovacion</Label>
        <Input
          id="ciclo_renovacion"
          value={fee.ciclo_renovacion}
          onChange={(event) => patch({ ciclo_renovacion: event.target.value })}
        />
        <CampoAyuda>
          Configuración pendiente de definir. En producción hay valores que no encajan con un ciclo
          de cobro (vacío, «2», etc.). No traducir hasta que producto lo cierre.
        </CampoAyuda>
      </div>
    </div>
  )
}

export function PasoFases({
  draft,
  setDraft,
}: {
  draft: Servicio
  setDraft: SetDraft
}) {
  const fases = draft.fases ?? []

  function setFases(next: ServicioFase[]) {
    setDraft((prev) => ({
      ...prev,
      fases: next.map((fase, index) => ({ ...fase, orden: index + 1 })),
    }))
  }

  return (
    <div className="space-y-4">
      {fases.map((fase, index) => (
        <div key={index} className="grid gap-3 rounded-lg p-3 ring-1 ring-foreground/10 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <Label>Nombre de la fase</Label>
            <Input
              value={fase.nombre}
              onChange={(event) => {
                const next = [...fases]
                next[index] = { ...fase, nombre: event.target.value }
                setFases(next)
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Hito de pago</Label>
        <Input
                value={fase.hito_pago}
                onChange={(event) => {
                  const next = [...fases]
                  next[index] = { ...fase, hito_pago: event.target.value }
                  setFases(next)
                }}
              />
              <p className="text-kicker">Cuándo se cobra esta fase (ej. al kickoff, al entregar).</p>
          </div>
          <div className="flex items-end">
            <Button
              variant="ghost"
              onClick={() => setFases(fases.filter((_, i) => i !== index))}
            >
              Quitar
            </Button>
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        onClick={() =>
          setFases([...fases, { nombre: "", orden: fases.length + 1, hito_pago: "" }])
        }
      >
        Agregar fase
      </Button>
    </div>
  )
}

export function PasoMargenes({
  draft,
  setDraft,
  defaults,
}: {
  draft: Servicio
  setDraft: SetDraft
  defaults: ConfiguracionGeneral | null
}) {
  return (
    <div className="grid max-w-lg gap-4">
      <p className="text-kicker">
        Si lo dejás en blanco, hereda los valores globales de Márgenes e impuestos. El override es
        solo para este servicio.
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="margen_default_pct">Margen de agencia (%)</Label>
        <Input
          id="margen_default_pct"
          type="number"
          value={draft.margen_default_pct ?? ""}
          placeholder={defaults ? String(defaults.margen_agencia_default_pct) : ""}
          onChange={(event) =>
            setDraft((prev) => ({
              ...prev,
              margen_default_pct:
                event.target.value === "" ? null : Number(event.target.value),
            }))
          }
        />
        <CampoAyuda>Porcentaje sobre el costo de proveedor que se suma como margen de agencia.</CampoAyuda>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="comision_sugerida_min_pct">Comisión sugerida mínima (%)</Label>
        <Input
          id="comision_sugerida_min_pct"
          type="number"
          value={draft.comision_sugerida_min_pct ?? ""}
          placeholder={defaults ? String(defaults.comision_agencia_default_min_pct) : ""}
          onChange={(event) =>
            setDraft((prev) => ({
              ...prev,
              comision_sugerida_min_pct:
                event.target.value === "" ? null : Number(event.target.value),
            }))
          }
        />
        <CampoAyuda>Piso del rango que ve el vendedor al armar la línea.</CampoAyuda>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="comision_sugerida_max_pct">Comisión sugerida máxima (%)</Label>
        <Input
          id="comision_sugerida_max_pct"
          type="number"
          value={draft.comision_sugerida_max_pct ?? ""}
          placeholder={defaults ? String(defaults.comision_agencia_default_max_pct) : ""}
          onChange={(event) =>
            setDraft((prev) => ({
              ...prev,
              comision_sugerida_max_pct:
                event.target.value === "" ? null : Number(event.target.value),
            }))
          }
        />
        <CampoAyuda>Techo del mismo rango. No es un valor fijo: es un intervalo.</CampoAyuda>
      </div>
    </div>
  )
}

export function PasoDocumentos({
  draft,
  setDraft,
  tipos,
  onCreateTipo,
}: {
  draft: Servicio
  setDraft: SetDraft
  tipos: TipoDocumento[]
  onCreateTipo: (nombre: string) => Promise<void>
}) {
  const seleccionados = new Set(draft.tipos_documento_requeridos ?? [])

  function toggle(id: string, checked: boolean) {
    setDraft((prev) => {
      const current = new Set(prev.tipos_documento_requeridos ?? [])
      if (checked) {
        current.add(id)
      } else {
        current.delete(id)
      }
      return { ...prev, tipos_documento_requeridos: [...current] }
    })
  }

  return (
    <div className="space-y-4">
      {tipos.map((tipo) => (
        <label key={tipo.id} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={seleccionados.has(tipo.id)}
            onCheckedChange={(checked) => toggle(tipo.id, checked === true)}
          />
          {tipo.nombre}
        </label>
      ))}
      <form
        className="flex max-w-md gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          const form = event.currentTarget
          const input = form.elements.namedItem("nuevo_tipo") as HTMLInputElement
          const nombre = input.value.trim()
          if (nombre) {
            void onCreateTipo(nombre).then(() => {
              input.value = ""
            })
          }
        }}
      >
        <Input name="nuevo_tipo" placeholder="Nuevo tipo de documento" />
        <Button type="submit" variant="outline">
          Crear
        </Button>
      </form>
    </div>
  )
}

export function PasoRevision({
  draft,
  tarifas,
  horasLaboralesMes = HORAS_LABORALES_MES_DEFAULT,
}: {
  draft: Servicio
  tarifas: TarifaInterna[]
  horasLaboralesMes?: number
}) {
  const total = costoInterno(draft.estimacion_interna_por_rol, tarifas, horasLaboralesMes)
  return (
    <dl className="grid max-w-xl gap-3 text-sm">
      <div>
        <dt className="text-muted-foreground">Nombre</dt>
        <dd>{draft.nombre || "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Categoría</dt>
        <dd>{draft.categoria || "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Descripción</dt>
        <dd>{draft.descripcion || "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Modelo de cobro</dt>
        <dd>{MODELO_COBRO_LABELS[draft.modelo_cobro]}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Se entrega en fases</dt>
        <dd>{draft.tiene_fases ? "Sí" : "No"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Costo interno</dt>
        <dd>{formatMoney(total)}</dd>
      </div>
      {draft.config_fee ? (
        <div>
          <dt className="text-muted-foreground">Fee</dt>
          <dd>
            monto {formatMoney(draft.config_fee.monto)} · duracion_minima {draft.config_fee.duracion_minima}{" "}
            · ciclo_renovacion {draft.config_fee.ciclo_renovacion || "—"}
          </dd>
        </div>
      ) : null}
      <div>
        <dt className="text-muted-foreground">Margen de agencia (%)</dt>
        <dd>{draft.margen_default_pct ?? "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Comisión sugerida (%)</dt>
        <dd>
          {draft.comision_sugerida_min_pct ?? "—"} – {draft.comision_sugerida_max_pct ?? "—"}
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Estado</dt>
        <dd>{draft.estado === "borrador" ? "Borrador" : draft.estado === "activo" ? "Activo" : "Archivado"}</dd>
      </div>
    </dl>
  )
}
