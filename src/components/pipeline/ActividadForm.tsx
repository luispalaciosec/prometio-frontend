import { useState, type FormEvent } from "react"
import { toast } from "sonner"

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
import { Textarea } from "@/components/ui/textarea"
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/datetime-local"
import {
  TIPOS_ACTIVIDAD,
  TIPO_ACTIVIDAD_LABELS,
  type Actividad,
  type TipoActividad,
} from "@/types/actividad"

export type ActividadFormValores = {
  tipo: TipoActividad
  programada_para: string | null
  reportada_en: string | null
  feedback: string | null
}

export function ActividadForm({
  modo,
  actividad,
  onSubmit,
  onCancel,
}: {
  modo: "programar" | "reportar" | "editar"
  actividad?: Actividad
  onSubmit: (input: ActividadFormValores) => void
  onCancel?: () => void
}) {
  const [tipo, setTipo] = useState<TipoActividad>(actividad?.tipo ?? "llamada")
  const [programadaRaw, setProgramadaRaw] = useState(toDatetimeLocalValue(actividad?.programada_para ?? null))
  const [reportadaRaw, setReportadaRaw] = useState(toDatetimeLocalValue(actividad?.reportada_en ?? null))
  const [feedbackRaw, setFeedbackRaw] = useState(actividad?.feedback ?? "")

  const muestraProgramada = modo === "programar" || modo === "editar"
  const muestraReportada = modo === "reportar" || modo === "editar"

  function enviar(event: FormEvent) {
    event.preventDefault()
    try {
      const programada_para = muestraProgramada ? fromDatetimeLocalValue(programadaRaw) : null
      const reportada_en = muestraReportada ? fromDatetimeLocalValue(reportadaRaw) : null
      onSubmit({
        tipo,
        programada_para,
        reportada_en,
        feedback: muestraReportada ? feedbackRaw : null,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fecha inválida.")
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-3 rounded-lg p-3 ring-1 ring-foreground/10">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="actividad-tipo">Tipo</Label>
          <Select value={tipo} onValueChange={(value) => setTipo(value as TipoActividad)}>
            <SelectTrigger id="actividad-tipo" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_ACTIVIDAD.map((codigo) => (
                <SelectItem key={codigo} value={codigo}>
                  {TIPO_ACTIVIDAD_LABELS[codigo]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {muestraProgramada ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="actividad-programada">programada_para</Label>
            <Input
              id="actividad-programada"
              type="datetime-local"
              value={programadaRaw}
              onChange={(event) => setProgramadaRaw(event.target.value)}
            />
          </div>
        ) : null}
        {muestraReportada ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="actividad-reportada">reportada_en</Label>
            <Input
              id="actividad-reportada"
              type="datetime-local"
              value={reportadaRaw}
              onChange={(event) => setReportadaRaw(event.target.value)}
            />
          </div>
        ) : null}
      </div>
      {muestraReportada ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="actividad-feedback">feedback</Label>
          <Textarea
            id="actividad-feedback"
            value={feedbackRaw}
            onChange={(event) => setFeedbackRaw(event.target.value)}
          />
        </div>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          {modo === "editar" ? "Guardar" : modo === "programar" ? "Programar" : "Reportar"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  )
}
