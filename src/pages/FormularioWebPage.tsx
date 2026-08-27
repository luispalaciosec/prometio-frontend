import { useState } from "react"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const WIDGET_SRC = "https://prometio.vercel.app/widget/prometio-form.js"
const FORMULARIO_API = "https://prometio-backend-production.up.railway.app/formulario"

const SNIPPET = `<script src="${WIDGET_SRC}"></script>
<prometio-formulario api="${FORMULARIO_API}"></prometio-formulario>`

const CAMPOS = [
  { name: "nombre_completo", label: "Nombre completo", required: true },
  { name: "email_trabajo", label: "Email de trabajo", required: false },
  { name: "telefono_movil", label: "Teléfono móvil", required: false },
  { name: "producto_interes", label: "Producto de interés", required: false },
  { name: "ciudad", label: "Ciudad", required: false },
  { name: "provincia", label: "Provincia", required: false },
] as const

function dominioDe(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

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
        description="Snippet para pegar en una landing. El POST llega a Contactos con fuente formulario web."
      />
      <div className="max-w-2xl space-y-8">
        <section className="space-y-3">
          <h2 className="text-section">Campos del formulario</h2>
          <p className="text-kicker">
            Fijos desde el corte 2. No se editan desde acá: lo que ve el visitante es este set.
          </p>
          <ul className="divide-y divide-border rounded-xl ring-1 ring-border">
            {CAMPOS.map((campo) => (
              <li key={campo.name} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-ui-medium">{campo.label}</span>
                <Badge variant={campo.required ? "warning" : "outline"}>
                  {campo.required ? "Obligatorio" : "Opcional"}
                </Badge>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-section">Dónde se conecta</h2>
          <dl className="space-y-3 rounded-xl p-4 ring-1 ring-border">
            <div>
              <dt className="text-kicker">Widget (script que se pega en la landing)</dt>
              <dd className="text-ui-medium">{dominioDe(WIDGET_SRC)}</dd>
              <dd className="break-all text-kicker">{WIDGET_SRC}</dd>
            </div>
            <div>
              <dt className="text-kicker">API que recibe el alta</dt>
              <dd className="text-ui-medium">{dominioDe(FORMULARIO_API)}</dd>
              <dd className="break-all text-kicker">{FORMULARIO_API}</dd>
            </div>
          </dl>
          <p className="text-kicker">
            El widget es público. No lleva token: el backend acepta el alta anónima. Colores del
            embed: pendiente de confirmar con backend si ya salen de la marca o si hace falta algo
            nuevo. Mientras tanto el snippet no se toca.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-section">Snippet</h2>
          <Textarea readOnly rows={4} value={SNIPPET} className="font-mono text-xs" />
          <Button type="button" onClick={() => void copiar()}>
            {copiado ? "Copiado" : "Copiar snippet"}
          </Button>
        </section>
      </div>
    </>
  )
}
