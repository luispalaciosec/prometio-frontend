import { Sparkles } from "lucide-react"

import { KindMark } from "@/components/kind-mark"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"

function HuecoContrato() {
  return (
    <div className="rounded-xl p-5 ring-1 ring-border">
      <div className="flex items-start gap-4">
        <span className="size-11 shrink-0 rounded-xl bg-muted" aria-hidden />
        <div className="min-w-0">
          <p className="text-kicker">Por confirmar</p>
          <p className="mt-1 text-page tabular-nums text-muted-foreground">—</p>
        </div>
      </div>
    </div>
  )
}

export function BienvenidaPage() {
  return (
    <>
      <PageHeader title="Bienvenida" description="Tu día en el CRM." />
      <div className="grid gap-4 sm:grid-cols-2">
        <HuecoContrato />
        <HuecoContrato />
        <HuecoContrato />
        <HuecoContrato />
        <section className="rounded-xl p-5 ring-1 ring-border">
          <div className="flex items-start gap-4">
            <KindMark icon={Sparkles} tone="bg-muted text-muted-foreground" size="lg" />
            <div className="min-w-0 space-y-2">
              <p className="text-ui-medium">Sugerencias</p>
              <Badge variant="outline">Próximamente</Badge>
              <p className="text-kicker">
                Sugerencias de IA. Se scopea en un corte propio; el lugar en esta pantalla ya queda
                reservado.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
