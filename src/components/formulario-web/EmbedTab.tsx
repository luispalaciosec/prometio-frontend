import { ExternalLink } from "lucide-react"
import { Link } from "react-router-dom"
import { useMemo } from "react"

import { CopyBlock } from "@/components/conectores/CopyBlock"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  FORMULARIO_UTM_KEYS,
  HCAPTCHA_SITE_KEY,
  buildSnippet,
  dominioDe,
  formularioCamposPublicUrl,
  formularioDemoUrl,
  formularioMarcaUrl,
  formularioPostUrl,
  widgetScriptUrl,
} from "@/lib/formulario-web-urls"

export function EmbedTab() {
  const urls = useMemo(
    () => ({
      widget: widgetScriptUrl(),
      post: formularioPostUrl(),
      marca: formularioMarcaUrl(),
      campos: formularioCamposPublicUrl(),
      demo: formularioDemoUrl(),
      snippet: buildSnippet(),
    }),
    [],
  )

  return (
    <div className="max-w-2xl space-y-8">
      <section className="space-y-3">
        <h2 className="text-section">Snippet</h2>
        <p className="text-kicker">
          Pegá esto en la landing del cliente. El script se sirve desde este mismo frontend; el POST va al
          backend configurado en <span className="font-mono text-micro">VITE_API_URL</span>.
        </p>
        <CopyBlock label="HTML para embeber" value={urls.snippet} multiline />
      </section>

      <section className="space-y-3">
        <h2 className="text-section">Probar en vivo</h2>
        <p className="text-kicker">
          Página pública con el mismo embed y panel UTM. Abrila en otra pestaña para validar campos, estilos
          y captcha sin sesión.
        </p>
        <Button type="button" variant="outline" asChild>
          <a href={urls.demo} target="_blank" rel="noreferrer">
            Abrir /formulario-demo
            <ExternalLink className="ml-2 size-4" strokeWidth={1.75} />
          </a>
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-section">Endpoints públicos</h2>
        <p className="text-kicker">
          El widget no lleva token. Deriva marca y campos a partir del atributo{" "}
          <span className="font-mono text-micro">api</span> del custom element.
        </p>
        <dl className="space-y-3 rounded-xl p-4 ring-1 ring-border">
          <EndpointRow label="Widget (script CDN)" url={urls.widget} />
          <EndpointRow label="POST alta de contacto" url={urls.post} />
          <EndpointRow label="GET marca + estilos" url={urls.marca} />
          <EndpointRow label="GET campos activos" url={urls.campos} />
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-section">UTM y click IDs</h2>
        <p className="text-kicker">
          El widget lee <span className="font-mono text-micro">window.location.search</span> de la página
          anfitriona al enviar. Si un parámetro no está en la URL, no se incluye en el POST.
        </p>
        <ul className="divide-y divide-border rounded-xl ring-1 ring-border">
          {FORMULARIO_UTM_KEYS.map((key) => (
            <li key={key} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="font-mono text-ui">{key}</span>
              <Badge variant="outline">Opcional</Badge>
            </li>
          ))}
        </ul>
        <p className="text-kicker">
          Ejemplo de prueba:{" "}
          <span className="font-mono text-micro">
            /formulario-demo?utm_source=google&amp;utm_medium=cpc&amp;utm_campaign=prueba
          </span>
        </p>
      </section>

      <section className="space-y-3 rounded-xl p-4 ring-1 ring-border">
        <h2 className="text-section">hCaptcha</h2>
        <p className="text-kicker">
          Site key pública embebida en el widget. El secret key y el estado de Meta/GA4 están en{" "}
          <Link
            to="/configuracion/formulario-web?tab=medicion"
            className="text-ui-medium underline-offset-4 hover:underline"
          >
            Medición
          </Link>
          .
        </p>
        <p className="break-all font-mono text-ui">{HCAPTCHA_SITE_KEY}</p>
      </section>
    </div>
  )
}

function EndpointRow({ label, url }: { label: string; url: string }) {
  return (
    <div>
      <dt className="text-kicker">{label}</dt>
      <dd className="text-ui-medium">{dominioDe(url)}</dd>
      <dd className="break-all text-kicker">{url}</dd>
    </div>
  )
}
