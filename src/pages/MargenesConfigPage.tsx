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
      toast.error("tasa_impuesto_pct es obligatorio (sin default en el schema).")
      return
    }
    const tasa_impuesto_pct = parseTasaImpuestoPct(tasaRaw)
    if (tasa_impuesto_pct === null) {
      toast.error("tasa_impuesto_pct debe ser numérico.")
      return
    }

    const defaults: Partial<Record<DefaultField, number>> = {}
    for (const key of DEFAULT_FIELDS) {
      const parsed = parseOptionalNumber(form[key])
      if (parsed === "invalid") {
        toast.error(`${key} debe ser numérico.`)
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
      toast.success("configuracion_general actualizada.")
      return
    }
    const created = await createConfiguracionGeneral({
      organizacion_id: perfil?.organizacion_id ?? MOCK_ORGANIZACION_ID,
      ...payload,
    })
    setExists(true)
    setForm(formFromRow(created))
    setTasaRaw(String(created.tasa_impuesto_pct))
    toast.success("configuracion_general creada.")
  }

  const fields: { key: DefaultField; hint: string }[] = [
    { key: "margen_agencia_default_pct", hint: "Margen de agencia global (default 30). En blanco, aplica el default de la base." },
    { key: "comision_agencia_default_min_pct", hint: "Piso del rango de comisión de agencia (default 13)." },
    { key: "comision_agencia_default_max_pct", hint: "Techo del rango de comisión de agencia (default 20)." },
    {
      key: "umbral_descuento_aprobacion_pct",
      hint: "Por encima de este % el descuento pide aprobación (default 10).",
    },
    {
      key: "multiplicador_escalamiento_supervisor",
      hint: "Global, no por etapa. También visible en Etapas y alertas (default 2).",
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
              ? "Fila única de configuracion_general. PATCH si ya existe. Campos en blanco no se envían."
              : "Todavía no hay fila. POST de creación — tasa_impuesto_pct es obligatorio; el resto, si queda en blanco, usa el DEFAULT del schema."
          }
          action={
            <Button type="submit">{exists ? "Guardar" : "Crear"}</Button>
          }
        />
      </div>
      {fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-2">
          <Label htmlFor={field.key}>{field.key}</Label>
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
        <Label htmlFor="tasa_impuesto_pct">tasa_impuesto_pct</Label>
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
          Obligatoria al crear. Nunca se inventa una tasa de IVA.
        </p>
      </div>
    </form>
  )
}
