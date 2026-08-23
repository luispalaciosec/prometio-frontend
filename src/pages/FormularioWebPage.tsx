import { useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const WIDGET_SRC = "https://prometio.vercel.app/widget/prometio-form.js"
const FORMULARIO_API = "https://prometio-backend-production.up.railway.app/formulario"

const SNIPPET = `<script src="${WIDGET_SRC}"></script>
<prometio-formulario api="${FORMULARIO_API}"></prometio-formulario>`

export function FormularioWebPage() {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(SNIPPET)
      setCopiado(true)
      toast.success("Snippet copiado.")
      window.setTimeout(() => setCopiado(false), 2000)
    } catch {
      toast.error("No se pudo copiar. Seleccioná el texto a mano.")
    }
  }

  return (
    <>
      <PageHeader
        title="Formulario web"
        description="Snippet para pegar en una landing. El POST llega a Contactos con fuente formulario_web."
      />
      <div className="max-w-2xl space-y-4">
        <p className="text-kicker">
          El widget es público. No lleva token: el backend acepta el alta anónima en{" "}
          <code className="text-xs">POST /formulario</code>.
        </p>
        <Textarea readOnly rows={4} value={SNIPPET} className="font-mono text-xs" />
        <Button type="button" onClick={() => void copiar()}>
          {copiado ? "Copiado" : "Copiar snippet"}
        </Button>
      </div>
    </>
  )
}
