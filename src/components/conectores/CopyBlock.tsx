import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

export function CopyBlock({
  label,
  value,
  multiline = false,
}: {
  label: string
  value: string
  multiline?: boolean
}) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(value)
      setCopiado(true)
      toast.success("Copiado.")
      window.setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error("No se pudo copiar. Seleccioná el texto a mano.")
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-kicker">{label}</p>
        <Button type="button" size="sm" variant="outline" onClick={() => void copiar()}>
          {copiado ? "Copiado" : "Copiar"}
        </Button>
      </div>
      {multiline ? (
        <pre className="overflow-x-auto rounded-xl p-3 font-mono text-micro ring-1 ring-border">
          {value}
        </pre>
      ) : (
        <p className="break-all rounded-xl p-3 font-mono text-micro ring-1 ring-border">{value}</p>
      )}
    </div>
  )
}
