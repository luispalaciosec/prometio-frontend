import { useEffect, useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  MOCK_ORGANIZACION_ID,
  createConfiguracionGeneral,
  getConfiguracionGeneral,
  updateConfiguracionGeneral,
} from "@/lib/config-api"
import { useAuthStore } from "@/store/auth-store"
import type { ConfiguracionGeneral } from "@/types/configuracion-general"

const DEFAULT_FIELDS = [
  "margen_agencia_default_pct",
  "comision_agencia_default_min_pct",
  "comision_agencia_default_max_pct",
  "umbral_descuento_aprobacion_pct",
  "multiplicador_escalamiento_supervisor",
] as const

type DefaultField = (typeof DEFAULT_FIELDS)[number]
type Form = Record<DefaultField, string>

const empty: Form = {
  margen_agencia_default_pct: "",
  comision_agencia_default_min_pct: "",
  comision_agencia_default_max_pct: "",
  umbral_descuento_aprobacion_pct: "",
  multiplicador_escalamiento_supervisor: "",
}

const PLACEHOLDERS: Record<DefaultField, string> = {
  margen_agencia_default_pct: "30",
  comision_agencia_default_min_pct: "13",
  comision_agencia_default_max_pct: "20",
  umbral_descuento_aprobacion_pct: "10",
  multiplicador_escalamiento_supervisor: "2",
}

function parseTasaImpuestoPct(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === "") {
    return null
  }
  const value = Number(trimmed)
  if (Number.isNaN(value)) {
    return null
  }
  return value
}

function parseOptionalNumber(raw: string): number | "empty" | "invalid" {
  const trimmed = raw.trim()
  if (trimmed === "") {
    return "empty"
  }
  const value = Number(trimmed)
  if (Number.isNaN(value)) {
    return "invalid"
  }
  return value
}

function formFromRow(row: ConfiguracionGeneral): Form {
  return {
    margen_agencia_default_pct: String(row.margen_agencia_default_pct),
    comision_agencia_default_min_pct: String(row.comision_agencia_default_min_pct),
    comision_agencia_default_max_pct: String(row.comision_agencia_default_max_pct),
    umbral_descuento_aprobacion_pct: String(row.umbral_descuento_aprobacion_pct),
    multiplicador_escalamiento_supervisor: String(row.multiplicador_escalamiento_supervisor),
  }
}

export function MargenesConfigPage() {
  const perfil = useAuthStore((state) => state.perfil)
  const [exists, setExists] = useState(false)
  const [form, setForm] = useState<Form>(empty)
  const [tasaRaw, setTasaRaw] = useState("")

  useEffect(() => {
    void getConfiguracionGeneral().then((row) => {
      if (!row) {
        setExists(false)
        setForm(empty)
        setTasaRaw("")
        return
      }
      setExists(true)
      setForm(formFromRow(row))
      setTasaRaw(String(row.tasa_impuesto_pct))
    })
  }, [])

  function setField(field: DefaultField, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function save() {
    if (tasaRaw.trim() === "") {
      toast.error("La tasa de impuesto es obligatoria (no hay un default en el sistema).")
      return
    }
    const tasa_impuesto_pct = parseTasaImpuestoPct(tasaRaw)
    if (tasa_impuesto_pct === null) {
      toast.error("La tasa de impuesto debe ser un número.")
      return
    }

    const defaults: Partial<Record<DefaultField, number>> = {}
    for (const key of DEFAULT_FIELDS) {
      const parsed = parseOptionalNumber(form[key])
      if (parsed === "invalid") {
        toast.error("Revisá que todos los porcentajes sean números.")
        return
      }
      if (parsed !== "empty") {
        defaults[key] = parsed
      }
    }

    const payload = { ...defaults, tasa_impuesto_pct }
    if (exists) {
      const updated = await updateConfiguracionGeneral(payload)
      setForm(formFromRow(updated))
      setTasaRaw(String(updated.tasa_impuesto_pct))
      toast.success("Configuración actualizada.")
      return
    }
    const created = await createConfiguracionGeneral({
      organizacion_id: perfil?.organizacion_id ?? MOCK_ORGANIZACION_ID,
      ...payload,
    })
    setExists(true)
    setForm(formFromRow(created))
    setTasaRaw(String(created.tasa_impuesto_pct))
    toast.success("Configuración creada.")
  }

  const fields: { key: DefaultField; label: string; hint: string }[] = [
    {
      key: "margen_agencia_default_pct",
      label: "Margen de agencia por defecto (%)",
      hint: "Se aplica a las líneas con proveedor si el servicio no tiene un override. Default 30.",
    },
    {
      key: "comision_agencia_default_min_pct",
      label: "Comisión de agencia mínima (%)",
      hint: "Piso del rango que ve el vendedor al armar una cotización. Default 13.",
    },
    {
      key: "comision_agencia_default_max_pct",
      label: "Comisión de agencia máxima (%)",
      hint: "Techo del mismo rango. Default 20.",
    },
    {
      key: "umbral_descuento_aprobacion_pct",
      label: "Umbral de descuento que pide aprobación (%)",
      hint: "Por encima de este porcentaje, la cotización pasa a preparación para que la apruebe un supervisor. Default 10.",
    },
    {
      key: "multiplicador_escalamiento_supervisor",
      label: "Multiplicador de escalamiento al supervisor",
      hint: "Global, no por etapa. Si una oportunidad supera umbral × este número, escala al supervisor. También se edita en Etapas y alertas. Default 2.",
    },
  ]

  return (
    <form
      className="grid max-w-md gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        void save()
      }}
    >
      <div className="max-w-none">
        <PageHeader
          title="Márgenes e impuestos"
          description={
            exists
              ? "Valores por defecto de toda la agencia. Un campo en blanco no se envía y deja el valor actual."
              : "Todavía no hay configuración. La tasa de impuesto es obligatoria; el resto, si queda en blanco, usa el default del sistema."
          }
          action={
            <Button type="submit">{exists ? "Guardar" : "Crear"}</Button>
          }
        />
      </div>
      {fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-2">
          <Label htmlFor={field.key}>{field.label}</Label>
          <Input
            id={field.key}
            type="number"
            step="0.1"
            placeholder={PLACEHOLDERS[field.key]}
            value={form[field.key]}
            onChange={(event) => setField(field.key, event.target.value)}
          />
          <p className="text-kicker">{field.hint}</p>
        </div>
      ))}
      <div className="flex flex-col gap-2">
        <Label htmlFor="tasa_impuesto_pct">Tasa de impuesto / IVA (%)</Label>
        <Input
          id="tasa_impuesto_pct"
          name="tasa_impuesto_pct"
          type="number"
          step="0.1"
          required
          value={tasaRaw}
          onChange={(event) => setTasaRaw(event.target.value)}
        />
        <p className="text-kicker">
          Obligatoria al crear. Nunca se inventa una tasa: hay que cargar la real de la organización.
        </p>
      </div>
    </form>
  )
}
