import { ExternalLink } from "lucide-react"
import { useSearchParams } from "react-router-dom"

import { EmbedTab } from "@/components/formulario-web/EmbedTab"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formularioDemoUrl } from "@/lib/formulario-web-urls"

const TAB_IDS = ["embed", "campos", "apariencia", "webhooks"] as const
type TabId = (typeof TAB_IDS)[number]

function esTabId(value: string | null): value is TabId {
  return TAB_IDS.includes(value as TabId)
}

function PlaceholderTab({ fase, titulo }: { fase: string; titulo: string }) {
  return (
    <div className="max-w-2xl rounded-xl p-6 ring-1 ring-border">
      <p className="text-section">{titulo}</p>
      <p className="mt-2 text-kicker text-muted-foreground">
        {fase} — próximo corte de esta pantalla.
      </p>
    </div>
  )
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
        description="Widget público para landings: snippet, campos, apariencia y webhooks."
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
        <TabsList>
          <TabsTrigger value="embed">Embed</TabsTrigger>
          <TabsTrigger value="campos">Campos</TabsTrigger>
          <TabsTrigger value="apariencia">Apariencia</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>
        <TabsContent value="embed">
          <EmbedTab />
        </TabsContent>
        <TabsContent value="campos">
          <PlaceholderTab fase="Fase B" titulo="Campos configurables" />
        </TabsContent>
        <TabsContent value="apariencia">
          <PlaceholderTab fase="Fase C" titulo="Apariencia del formulario" />
        </TabsContent>
        <TabsContent value="webhooks">
          <PlaceholderTab fase="Fase D" titulo="Webhooks salientes" />
        </TabsContent>
      </Tabs>
    </>
  )
}
