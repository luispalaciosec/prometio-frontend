import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"

import { ConectorCard } from "@/components/conectores/ConectorCard"
import { CopyBlock } from "@/components/conectores/CopyBlock"
import { PageHeader } from "@/components/page-header"

const BACKEND_URL = "https://prometio-backend-production.up.railway.app"

const MCP_CONFIG = `{
  "mcpServers": {
    "prometio": {
      "command": "python",
      "args": ["-m", "app.mcp_server"],
      "cwd": "/ruta/a/prometio-backend",
      "env": { "PROMETIO_ACCESS_TOKEN": "<tu-access-token>" }
    }
  }
}`

function Paso({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-ui-medium"
      >
        {n}
      </span>
      <div className="min-w-0 space-y-3 pt-1">{children}</div>
    </li>
  )
}

export function ConectoresPage() {
  return (
    <>
      <PageHeader
        title="Conectores"
        description="Claude se instala en tu máquina vía MCP. ChatGPT y Gemini todavía no tienen integración."
      />
      <div className="space-y-4">
        <section className="rounded-xl p-4 ring-1 ring-border">
          <div className="flex items-start gap-3">
            <div
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-medium"
            >
              C
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-ui-medium">Claude</p>
              <Badge variant="outline">stdio local</Badge>
            </div>
          </div>
          <p className="mt-4 max-w-prose text-kicker">
            Nuestro MCP corre local (stdio), no como un servidor remoto al que cualquiera se conecta
            con una URL. Por eso el JSON tiene <span className="font-mono text-micro">cwd</span> (la
            ruta del backend en tu máquina) y no una URL de servidor MCP. La URL de abajo es la del
            backend contra el que ese proceso local habla: sirve para confirmar que estás apuntando
            al entorno correcto, o para armar tu <span className="font-mono text-micro">.env</span>{" "}
            local si hace falta.
          </p>
          <div className="mt-4">
            <CopyBlock label="Servidor backend" value={BACKEND_URL} />
          </div>
          <ol className="mt-6 space-y-5">
            <Paso n={1}>
              <p className="text-ui">
                Instalá{" "}
                <a
                  href="https://claude.ai/download"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Claude Desktop
                </a>
                .
              </p>
            </Paso>
            <Paso n={2}>
              <p className="text-ui">
                Abrí la configuración del MCP: Settings → Developer → Edit Config. Eso abre{" "}
                <span className="font-mono text-micro">claude_desktop_config.json</span>.
              </p>
            </Paso>
            <Paso n={3}>
              <p className="text-ui">
                Pegá la configuración de nuestro servidor. Reemplazá{" "}
                <span className="font-mono text-micro">cwd</span> por la ruta real de{" "}
                <span className="font-mono text-micro">prometio-backend</span> en tu máquina y{" "}
                <span className="font-mono text-micro">PROMETIO_ACCESS_TOKEN</span> por el JWT de tu
                sesión (el mismo que usa el resto de la API). Si el token vence, hay que reiniciar el
                proceso con uno nuevo.
              </p>
              <CopyBlock label="claude_desktop_config.json" value={MCP_CONFIG} multiline />
            </Paso>
          </ol>
        </section>
        <div className="grid gap-3 sm:grid-cols-2">
          <ConectorCard nombre="ChatGPT" inicial="C" estado="proximamente" />
          <ConectorCard nombre="Gemini" inicial="G" estado="proximamente" />
        </div>
      </div>
    </>
  )
}
