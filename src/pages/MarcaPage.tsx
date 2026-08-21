import { PrometioLogo } from "@/components/prometio-logo"
import { PageHeader } from "@/components/page-header"

const SWATCHES = [
  { token: "Fondo", className: "bg-background ring-1 ring-border", hex: "#FFFFFF" },
  { token: "Primary", className: "bg-primary", hex: "#05729F" },
  { token: "Sidebar", className: "bg-sidebar", hex: "#0D2030" },
  { token: "Acento", className: "bg-highlight", hex: "#05C7E8" },
  { token: "Texto", className: "bg-foreground", hex: "#06080B" },
  { token: "Ámbar (alerta)", className: "bg-warning", hex: "#C9842A" },
] as const

export function MarcaPage() {
  return (
    <>
      <PageHeader
        title="Marca"
        description="Identidad visual de prometIO. La subida a Storage y los colores de organizacion llegan después."
      />
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="font-heading text-base tracking-tight">Logo</h2>
          {/* subida real pendiente — por ahora asset fijo */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-background p-6 ring-1 ring-border">
              <p className="mb-4 text-xs text-muted-foreground">Sobre claro</p>
              <PrometioLogo className="h-8 w-auto" />
            </div>
            <div className="rounded-xl bg-sidebar p-6">
              <p className="mb-4 text-xs text-sidebar-foreground/60">Sobre oscuro (sidebar)</p>
              <PrometioLogo onDark className="h-8 w-auto" />
            </div>
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="font-heading text-base tracking-tight">Paleta</h2>
          <ul className="grid gap-3 sm:grid-cols-3">
            {SWATCHES.map((swatch) => (
              <li key={swatch.token} className="overflow-hidden rounded-xl ring-1 ring-border">
                <div className={`h-16 ${swatch.className}`} />
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{swatch.token}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{swatch.hex}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
