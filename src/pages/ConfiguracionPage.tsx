import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { getConfiguracionGeneral } from "@/lib/config-api"
import { CONFIG_NAV_GROUPS } from "@/lib/config-nav"

const RESEND_FALLBACK = "https://resend.com/overview"

export function ConfiguracionPage() {
  const [resendUrl, setResendUrl] = useState(RESEND_FALLBACK)

  useEffect(() => {
    void getConfiguracionGeneral()
      .then((row) => {
        if (row?.resend_dashboard_url) {
          setResendUrl(row.resend_dashboard_url)
        }
      })
      .catch(() => {
        /* el fallback alcanza */
      })
  }, [])

  return (
    <>
      <PageHeader
        title="Configuración"
        description="Parámetros de la organización. Lecturas y escrituras van al backend real."
      />
      <div className="space-y-8">
        {CONFIG_NAV_GROUPS.map((group) => (
          <section key={group.title} className="space-y-3">
            <h2 className="text-section">{group.title}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-xl p-4 ring-1 ring-border transition-shadow duration-150 hover:shadow-raised hover:ring-foreground/20"
                >
                  <p className="text-ui-medium">{item.label}</p>
                  <p className="mt-1 text-kicker">{item.body}</p>
                  <Button variant="link" className="mt-2 h-auto px-0">
                    Abrir
                  </Button>
                </Link>
              ))}
            </div>
          </section>
        ))}
        <section className="space-y-3">
          <h2 className="text-section">Accesos externos</h2>
          <a
            href={resendUrl}
            target="_blank"
            rel="noreferrer"
            className="block rounded-xl p-4 ring-1 ring-border transition-shadow duration-150 hover:shadow-raised hover:ring-foreground/20 sm:max-w-md"
          >
            <p className="text-ui-medium">Resend</p>
            <p className="mt-1 text-kicker">
              Campañas de email se arman y envían ahí, no en prometIO. El link no inicia sesión
              por vos.
            </p>
            <Button variant="link" className="mt-2 h-auto px-0">
              Abrir dashboard
            </Button>
          </a>
        </section>
      </div>
    </>
  )
}
