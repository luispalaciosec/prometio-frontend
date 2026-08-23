import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/datetime-local"
import { TipoActividadMark } from "@/components/pipeline/TipoActividadMark"
import type { Actividad } from "@/types/actividad"

export function ActividadReportar({
  actividad,
  onSubmit,
  onCancel,
}: {
  actividad: Actividad
  onSubmit: (input: { reportada_en: string; feedback: string }) => void
  onCancel: () => void
}) {
  const [reportadaRaw, setReportadaRaw] = useState(toDatetimeLocalValue(new Date().toISOString()))
  const [feedbackRaw, setFeedbackRaw] = useState("")

  function enviar(event: FormEvent) {
    event.preventDefault()
    try {
      const reportada_en = fromDatetimeLocalValue(reportadaRaw)
      if (reportada_en == null) {
        toast.error("se requiere al menos uno de programada_para/reportada_en")
        return
      }
      onSubmit({ reportada_en, feedback: feedbackRaw })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fecha inválida.")
    }
  }

  return (
    <form onSubmit={enviar} className="mt-3 space-y-3 rounded-lg p-3 ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-center gap-2">
        <TipoActividadMark tipo={actividad.tipo} />
        <p className="text-kicker">Se agrega reportada_en; programada_para se conserva.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`reportar-${actividad.id}-fecha`}>reportada_en</Label>
        <Input
          id={`reportar-${actividad.id}-fecha`}
          type="datetime-local"
          value={reportadaRaw}
          onChange={(event) => setReportadaRaw(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`reportar-${actividad.id}-feedback`}>feedback</Label>
        <Textarea
          id={`reportar-${actividad.id}-feedback`}
          value={feedbackRaw}
          onChange={(event) => setFeedbackRaw(event.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Reportar
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
