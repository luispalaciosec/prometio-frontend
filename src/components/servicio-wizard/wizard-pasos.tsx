import type { ModeloCobro, Servicio, ServicioFase } from "@/types/servicio"
import type { TarifaInterna } from "@/types/tarifa-interna"
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
import { costoInterno, formatMoney } from "@/lib/costo-interno"

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
}: {
  draft: Servicio
  setDraft: SetDraft
}) {
  return (
    <div className="grid max-w-lg gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="nombre">nombre</Label>
        <Input
          id="nombre"
          value={draft.nombre}
          onChange={(event) =>
            setDraft((prev) => ({ ...prev, nombre: event.target.value }))
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="categoria">categoria</Label>
        <Input
          id="categoria"
          value={draft.categoria ?? ""}
          onChange={(event) =>
            setDraft((prev) => ({
              ...prev,
              categoria: event.target.value || null,
            }))
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="descripcion">descripcion</Label>
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
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={draft.tiene_fases}
          onCheckedChange={(checked) =>
            setDraft((prev) => ({ ...prev, tiene_fases: checked === true }))
          }
        />
        tiene_fases
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
          ["por_hora", "Por hora"],
          ["fee_fijo", "Fee fijo"],
          ["fee_recurrente", "Fee recurrente"],
        ] as const
      ).map(([value, label]) => (
        <label key={value} className="flex items-center gap-2 text-sm">
          <RadioGroupItem value={value} id={value} />
          <span>
            {label} <span className="font-mono text-xs text-muted-foreground">({value})</span>
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
}: {
  draft: Servicio
  setDraft: SetDraft
  tarifas: TarifaInterna[]
}) {
  const estimacion = draft.estimacion_horas_por_rol ?? {}
  const usadas = new Set(Object.keys(estimacion))
  const disponibles = tarifas.filter((row) => !usadas.has(row.id))
  const total = costoInterno(estimacion, tarifas)

  function setHoras(id: string, horas: number) {
    setDraft((prev) => {
      const next = { ...(prev.estimacion_horas_por_rol ?? {}) }
      if (horas <= 0) {
        delete next[id]
      } else {
        next[id] = horas
      }
      return { ...prev, estimacion_horas_por_rol: next }
    })
  }

  return (
    <div className="space-y-4">
      {Object.entries(estimacion).map(([id, horas]) => {
        const tarifa = tarifas.find((row) => row.id === id)
        return (
          <div key={id} className="flex items-end gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">{tarifa?.nombre_rol ?? id}</p>
              <p className="text-xs text-muted-foreground">
                {tarifa ? `${formatMoney(tarifa.costo_hora)} / h` : ""}
              </p>
            </div>
            <div className="w-28">
              <Label htmlFor={`horas-${id}`}>horas</Label>
              <Input
                id={`horas-${id}`}
                type="number"
                min="0"
                step="0.5"
                value={horas}
                onChange={(event) => setHoras(id, Number(event.target.value))}
              />
            </div>
            <Button variant="ghost" onClick={() => setHoras(id, 0)}>
              Quitar
            </Button>
          </div>
        )
      })}
      {disponibles.length > 0 ? (
        <Select
          onValueChange={(id) => setHoras(id, 1)}
        >
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Agregar rol de tarifa_interna" />
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
      <p className="text-sm">
        Costo interno en vivo:{" "}
        <span className="font-medium">{formatMoney(total)}</span>
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
        <Label htmlFor="monto">monto</Label>
        <Input
          id="monto"
          type="number"
          min="0"
          value={fee.monto}
          onChange={(event) => patch({ monto: Number(event.target.value) })}
        />
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
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ciclo_renovacion">ciclo_renovacion</Label>
        <Input
          id="ciclo_renovacion"
          value={fee.ciclo_renovacion}
          onChange={(event) => patch({ ciclo_renovacion: event.target.value })}
        />
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
            <Label>nombre</Label>
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
            <Label>hito_pago</Label>
            <Input
              value={fase.hito_pago}
              onChange={(event) => {
                const next = [...fases]
                next[index] = { ...fase, hito_pago: event.target.value }
                setFases(next)
              }}
            />
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
        Hereda configuracion_general (margen_agencia_default_pct / comision_agencia_default_*).
        El override del servicio usa margen_default_pct y comision_sugerida_* — nombres distintos a propósito.
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="margen_default_pct">margen_default_pct</Label>
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
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="comision_sugerida_min_pct">comision_sugerida_min_pct</Label>
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
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="comision_sugerida_max_pct">comision_sugerida_max_pct</Label>
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
        <Input name="nuevo_tipo" placeholder="Nuevo tipo_documento" />
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
}: {
  draft: Servicio
  tarifas: TarifaInterna[]
}) {
  const total = costoInterno(draft.estimacion_horas_por_rol, tarifas)
  return (
    <dl className="grid max-w-xl gap-3 text-sm">
      <div>
        <dt className="text-muted-foreground">nombre</dt>
        <dd>{draft.nombre || "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">categoria</dt>
        <dd>{draft.categoria || "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">descripcion</dt>
        <dd>{draft.descripcion || "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">modelo_cobro</dt>
        <dd className="font-mono text-xs">{draft.modelo_cobro}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">tiene_fases</dt>
        <dd>{draft.tiene_fases ? "true" : "false"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">costo interno</dt>
        <dd>{formatMoney(total)}</dd>
      </div>
      {draft.config_fee ? (
        <div>
          <dt className="text-muted-foreground">config_fee</dt>
          <dd>
            monto {draft.config_fee.monto} · duracion_minima {draft.config_fee.duracion_minima} ·{" "}
            {draft.config_fee.ciclo_renovacion}
          </dd>
        </div>
      ) : null}
      <div>
        <dt className="text-muted-foreground">margen_default_pct</dt>
        <dd>{draft.margen_default_pct ?? "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">comisión sugerida</dt>
        <dd>
          {draft.comision_sugerida_min_pct ?? "—"} – {draft.comision_sugerida_max_pct ?? "—"} %
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">estado</dt>
        <dd>{draft.estado}</dd>
      </div>
    </dl>
  )
}
