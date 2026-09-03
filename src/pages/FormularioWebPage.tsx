import { ExternalLink } from "lucide-react"
import { useSearchParams } from "react-router-dom"

import { AparienciaTab } from "@/components/formulario-web/AparienciaTab"
import { CamposTab } from "@/components/formulario-web/CamposTab"
import { EmbedTab } from "@/components/formulario-web/EmbedTab"
import { MedicionTab } from "@/components/formulario-web/MedicionTab"
import { WebhooksTab } from "@/components/formulario-web/WebhooksTab"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formularioDemoUrl } from "@/lib/formulario-web-urls"

const TAB_IDS = ["embed", "campos", "apariencia", "webhooks", "medicion"] as const
type TabId = (typeof TAB_IDS)[number]

function esTabId(value: string | null): value is TabId {
  return TAB_IDS.includes(value as TabId)
}

export function FormularioWebPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get("tab")
  const tab = esTabId(tabParam) ? tabParam : "embed"

  function setTab(next: string) {
    if (!esTabId(next)) {
      return
    }
    setSearchParams(next === "embed" ? {} : { tab: next }, { replace: true })
  }

  return (
    <>
      <PageHeader
        title="Formulario web"
        description="Widget público: snippet, campos, apariencia, webhooks y medición."
        action={
          <Button type="button" variant="outline" asChild>
            <a href={formularioDemoUrl()} target="_blank" rel="noreferrer">
              Abrir demo
              <ExternalLink className="ml-2 size-4" strokeWidth={1.75} />
            </a>
          </Button>
        }
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="embed">Embed</TabsTrigger>
          <TabsTrigger value="campos">Campos</TabsTrigger>
          <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="medicion">Medición</TabsTrigger>
        </TabsList>
        <TabsContent value="embed">
          <EmbedTab />
        </TabsContent>
        <TabsContent value="campos">
          <CamposTab />
        </TabsContent>
        <TabsContent value="apariencia">
          <AparienciaTab />
        </TabsContent>
        <TabsContent value="webhooks">
          <WebhooksTab />
        </TabsContent>
        <TabsContent value="medicion">
          <MedicionTab />
        </TabsContent>
      </Tabs>
    </>
  )
}
