import { Link } from "react-router-dom"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { CONFIG_NAV_GROUPS } from "@/lib/config-nav"

export function ConfiguracionPage() {
  return (
    <>
      <PageHeader
        title="Configuración"
        description="Parámetros de la organización. Lecturas y escrituras van al backend real."
      />
      <div className="space-y-8">
        {CONFIG_NAV_GROUPS.map((group) => (
          <section key={group.title} className="space-y-3">
            <h2 className="font-heading text-base tracking-tight">{group.title}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-xl p-4 ring-1 ring-foreground/10 transition-colors duration-150 hover:bg-muted/50 hover:ring-primary/20"
                >
                  <p className="font-medium">{item.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                  <Button variant="link" className="mt-2 h-auto px-0">
                    Abrir
                  </Button>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
