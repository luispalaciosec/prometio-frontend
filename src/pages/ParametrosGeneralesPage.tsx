import { useEffect, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { SlidersHorizontal } from "lucide-react"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { DetailSkeleton } from "@/components/skeleton"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getConfiguracionGeneral, updateParametrosGenerales } from "@/lib/config-api"
import {
  METODO_ASIGNACION_LEADS_LABELS,
  METODOS_ASIGNACION_LEADS,
  type ConfiguracionGeneral,
  type MetodoAsignacionLeads,
  type ParametrosGeneralesUpdate,
} from "@/types/configuracion-general"

type CampoEntero =
  | "dias_validez_cotizacion"
  | "contrato_dias_aviso_renovacion"
  | "linkedin_cooldown_horas"
  | "linkedin_max_criterios_por_corrida"
  | "linkedin_max_perfiles_por_corrida"
  | "dias_anticipacion_cumpleanos"

type CampoTexto =
  | "condiciones_comerciales_texto"
  | "exclusiones_default_texto"
  | "consideraciones_default_texto"
  | "por_que_geeks_default_texto"

type Form = Record<CampoEntero, string> &
  Record<CampoTexto, string> & {
    requiere_documento_alcance: boolean
    metodo_asignacion_leads: MetodoAsignacionLeads
  }

/** Mínimo aceptado por campo: el cooldown puede ser 0 (sin espera); el resto, al menos 1. */
const MINIMO: Record<CampoEntero, number> = {
  dias_validez_cotizacion: 1,
  contrato_dias_aviso_renovacion: 1,
  linkedin_cooldown_horas: 0,
  linkedin_max_criterios_por_corrida: 1,
  linkedin_max_perfiles_por_corrida: 1,
  dias_anticipacion_cumpleanos: 1,
}

const ETIQUETA: Record<CampoEntero, string> = {
  dias_validez_cotizacion: "Días de validez de una cotización",
  contrato_dias_aviso_renovacion: "Días de aviso antes de que venza un contrato",
  linkedin_cooldown_horas: "Horas de espera entre búsquedas",
  linkedin_max_criterios_por_corrida: "Criterios por búsqueda",
  linkedin_max_perfiles_por_corrida: "Perfiles por búsqueda",
  dias_anticipacion_cumpleanos: "Días de anticipación para cumpleaños",
}

function formDesde(row: ConfiguracionGeneral): Form {
  const numero = (value: number | undefined) => (value == null ? "" : String(value))
  return {
    dias_validez_cotizacion: numero(row.dias_validez_cotizacion),
    contrato_dias_aviso_renovacion: numero(row.contrato_dias_aviso_renovacion),
    linkedin_cooldown_horas: numero(row.linkedin_cooldown_horas),
    linkedin_max_criterios_por_corrida: numero(row.linkedin_max_criterios_por_corrida),
    linkedin_max_perfiles_por_corrida: numero(row.linkedin_max_perfiles_por_corrida),
    dias_anticipacion_cumpleanos: numero(row.dias_anticipacion_cumpleanos),
    condiciones_comerciales_texto: row.condiciones_comerciales_texto ?? "",
    exclusiones_default_texto: row.exclusiones_default_texto ?? "",
    consideraciones_default_texto: row.consideraciones_default_texto ?? "",
    por_que_geeks_default_texto: row.por_que_geeks_default_texto ?? "",
    requiere_documento_alcance: row.requiere_documento_alcance === true,
    metodo_asignacion_leads: row.metodo_asignacion_leads ?? "round_robin",
  }
}

function Seccion({ titulo, descripcion, children }: { titulo: string; descripcion: string; children: ReactNode }) {
  return (
    <section className="space-y-4 surface-card p-4 sm:p-5">
      <div>
        <h2 className="text-section">{titulo}</h2>
        <p className="mt-1 text-kicker">{descripcion}</p>
      </div>
      {children}
    </section>
  )
}

export function ParametrosGeneralesPage() {
  const [original, setOriginal] = useState<ConfiguracionGeneral | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let cancelled = false
    void getConfiguracionGeneral()
      .then((row) => {
        if (!cancelled && row) {
          setOriginal(row)
          setForm(formDesde(row))
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "No se pudo cargar la configuración.")
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCargando(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  function campoEntero(campo: CampoEntero, ayuda: string) {
    if (!form) {
      return null
    }
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={campo}>{ETIQUETA[campo]}</Label>
        <Input
          id={campo}
          type="number"
          inputMode="numeric"
          min={MINIMO[campo]}
          step={1}
          value={form[campo]}
          onChange={(event) => setForm((prev) => (prev ? { ...prev, [campo]: event.target.value } : prev))}
          className="sm:max-w-40"
        />
        <p className="text-kicker">{ayuda}</p>
      </div>
    )
  }

  function campoTexto(campo: CampoTexto, etiqueta: string, ayuda: string) {
    if (!form) {
      return null
    }
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={campo}>{etiqueta}</Label>
        <Textarea
          id={campo}
          rows={4}
          value={form[campo]}
          onChange={(event) => setForm((prev) => (prev ? { ...prev, [campo]: event.target.value } : prev))}
        />
        <p className="text-kicker">{ayuda}</p>
      </div>
    )
  }

  async function guardar() {
    if (!form || !original) {
      return
    }
    const patch: ParametrosGeneralesUpdate = {}
    for (const campo of Object.keys(MINIMO) as CampoEntero[]) {
      const raw = form[campo].trim()
      const valor = Number(raw)
      if (raw === "" || !Number.isInteger(valor) || valor < MINIMO[campo]) {
        toast.error(`${ETIQUETA[campo]}: tiene que ser un número entero desde ${MINIMO[campo]}.`)
        return
      }
      if (valor !== original[campo]) {
        patch[campo] = valor
      }
    }
    for (const campo of [
      "condiciones_comerciales_texto",
      "exclusiones_default_texto",
      "consideraciones_default_texto",
      "por_que_geeks_default_texto",
    ] as CampoTexto[]) {
      const valor = form[campo].trim() || null
      if (valor !== (original[campo] ?? null)) {
        patch[campo] = valor
      }
    }
    if (form.requiere_documento_alcance !== (original.requiere_documento_alcance === true)) {
      patch.requiere_documento_alcance = form.requiere_documento_alcance
    }
    if (form.metodo_asignacion_leads !== original.metodo_asignacion_leads) {
      patch.metodo_asignacion_leads = form.metodo_asignacion_leads
    }
    if (Object.keys(patch).length === 0) {
      toast.message("No hay cambios para guardar.")
      return
    }
    setGuardando(true)
    try {
      const row = await updateParametrosGenerales(patch)
      setOriginal(row)
      setForm(formDesde(row))
      toast.success("Parámetros guardados.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron guardar los parámetros.")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form
      className="max-w-3xl space-y-6"
      onSubmit={(event) => {
        event.preventDefault()
        void guardar()
      }}
    >
      <PageHeader
        title="Parámetros generales"
        description="Reglas de toda la agencia que no son márgenes ni impuestos. Aplican desde que guardás."
        action={
          form ? (
            <Button type="submit" disabled={guardando}>
              Guardar
            </Button>
          ) : null
        }
      />
      {cargando ? (
        <DetailSkeleton />
      ) : !form ? (
        <EmptyState
          icon={SlidersHorizontal}
          title="Todavía no hay configuración"
          body="Primero cargá la tasa de impuesto en Márgenes e impuestos; con eso se crea la configuración general."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link to="/configuracion/margenes">Ir a Márgenes e impuestos</Link>
            </Button>
          }
        />
      ) : (
        <>
          <Seccion titulo="Cotizaciones" descripcion="Lo que se imprime en el PDF y cuánto dura la oferta.">
            {campoEntero("dias_validez_cotizacion", "Define la fecha «válida hasta» de cada cotización al enviarla.")}
            {campoTexto(
              "condiciones_comerciales_texto",
              "Condiciones comerciales",
              "Texto fijo que acompaña a las cotizaciones. Vacío = sin condiciones.",
            )}
          </Seccion>

          <Seccion
            titulo="Documento de alcance"
            descripcion="Cuándo es obligatorio y con qué textos arranca cada documento nuevo."
          >
            <label className="flex items-start gap-2 text-ui">
              <Checkbox
                checked={form.requiere_documento_alcance}
                onCheckedChange={(value) =>
                  setForm((prev) => (prev ? { ...prev, requiere_documento_alcance: value === true } : prev))
                }
                className="mt-0.5"
              />
              <span>
                Exigir documento de alcance aprobado para enviar cotizaciones
                <span className="block text-kicker">
                  Interruptor general. Además, cada servicio marca si lo necesita; se exige solo si los dos lo piden.
                </span>
              </span>
            </label>
            {campoTexto("exclusiones_default_texto", "Exclusiones por defecto", "Sección «Exclusiones» de un documento nuevo.")}
            {campoTexto(
              "consideraciones_default_texto",
              "Consideraciones por defecto",
              "Sección «Consideraciones» de un documento nuevo.",
            )}
            {campoTexto(
              "por_que_geeks_default_texto",
              "«Por qué Geeks» por defecto",
              "Sección de presentación de la agencia en un documento nuevo.",
            )}
          </Seccion>

          <Seccion titulo="Contratos de fee" descripcion="Cuándo un contrato pasa a «Por renovar».">
            {campoEntero(
              "contrato_dias_aviso_renovacion",
              "Un contrato vigente pasa a «Por renovar» cuando le quedan estos días o menos. También es la ventana por defecto de Renovaciones.",
            )}
          </Seccion>

          <Seccion titulo="Prospección en LinkedIn" descripcion="Límites de cada búsqueda en Apify (consumen créditos).">
            {campoEntero("linkedin_cooldown_horas", "Tiempo mínimo entre una búsqueda y la siguiente. 0 = sin espera.")}
            {campoEntero("linkedin_max_criterios_por_corrida", "Cuántos criterios activos se usan en cada búsqueda.")}
            {campoEntero("linkedin_max_perfiles_por_corrida", "Tope de perfiles que trae cada búsqueda.")}
          </Seccion>

          <Seccion titulo="Leads y agenda" descripcion="Cómo se reparten los leads nuevos y cuándo avisar cumpleaños.">
            <div className="flex flex-col gap-2">
              <Label htmlFor="metodo_asignacion_leads">Método de asignación de leads</Label>
              <Select
                value={form.metodo_asignacion_leads}
                onValueChange={(value) =>
                  setForm((prev) => (prev ? { ...prev, metodo_asignacion_leads: value as MetodoAsignacionLeads } : prev))
                }
              >
                <SelectTrigger id="metodo_asignacion_leads" className="sm:max-w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_ASIGNACION_LEADS.map((metodo) => (
                    <SelectItem key={metodo} value={metodo}>
                      {METODO_ASIGNACION_LEADS_LABELS[metodo]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {campoEntero("dias_anticipacion_cumpleanos", "Con cuántos días de anticipación aparece un cumpleaños.")}
          </Seccion>
        </>
      )}
    </form>
  )
}
