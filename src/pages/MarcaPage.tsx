import { useEffect, useState } from "react"
import { toast } from "sonner"

import { BrandSurface } from "@/components/brand-surface"
import { PrometioLogo } from "@/components/prometio-logo"
import { PageHeader } from "@/components/page-header"
import { DetailSkeleton } from "@/components/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  getOrganizacion,
  updateOrganizacion,
  uploadLogoOrganizacion,
  uploadLogoOscuroOrganizacion,
} from "@/lib/api/organizacion"
import { applyOrganizationBrandTheme, readThemeHex } from "@/lib/theme"
import { useOrgStore } from "@/store/org-store"
import type { Organizacion } from "@/types/organizacion"

const HEX = /^#[0-9A-Fa-f]{6}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function vacio(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

export function MarcaPage() {
  const setOrganizacion = useOrgStore((state) => state.setOrganizacion)
  const [org, setOrg] = useState<Organizacion | null>(null)
  const [cargando, setCargando] = useState(true)
  const [sitio, setSitio] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [primario, setPrimario] = useState("")
  const [secundario, setSecundario] = useState("")
  const [terciario, setTerciario] = useState("")
  const [cuaternario, setCuaternario] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState<"claro" | "oscuro" | null>(null)

  function aplicar(row: Organizacion) {
    setOrg(row)
    setSitio(row.sitio_web_url ?? "")
    setEmail(row.email ?? "")
    setTelefono(row.telefono ?? "")
    setPrimario(row.color_primario ?? "")
    setSecundario(row.color_secundario ?? "")
    setTerciario(row.color_terciario ?? "")
    setCuaternario(row.color_cuaternario ?? "")
    setOrganizacion(row)
    applyOrganizationBrandTheme({
      primary: row.color_primario,
      secondary: row.color_secundario,
      tertiary: row.color_terciario,
      quaternary: row.color_cuaternario,
    })
  }

  useEffect(() => {
    void getOrganizacion()
      .then(aplicar)
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "No se pudo cargar la marca.")
      })
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    if (cargando && !org) {
      return
    }
    applyOrganizationBrandTheme({
      primary: HEX.test(primario) ? primario : (org?.color_primario ?? null),
      secondary: HEX.test(secundario) ? secundario : (org?.color_secundario ?? null),
      tertiary: HEX.test(terciario) ? terciario : (org?.color_terciario ?? null),
      quaternary: HEX.test(cuaternario) ? cuaternario : (org?.color_cuaternario ?? null),
    })
  }, [primario, secundario, terciario, cuaternario, org, cargando])

  async function guardar() {
    const colores: [string, string][] = [
      [primario, "primario"],
      [secundario, "secundario"],
      [terciario, "terciario"],
      [cuaternario, "cuaternario"],
    ]
    for (const [value, nombre] of colores) {
      if (value && !HEX.test(value)) {
        toast.error(`El color ${nombre} debe ser un hex #RRGGBB.`)
        return
      }
    }
    const emailTrim = email.trim()
    if (emailTrim && !EMAIL.test(emailTrim)) {
      toast.error("El email de la organización no es válido.")
      return
    }
    setGuardando(true)
    try {
      const row = await updateOrganizacion({
        sitio_web_url: vacio(sitio),
        email: vacio(email),
        telefono: vacio(telefono),
        color_primario: vacio(primario),
        color_secundario: vacio(secundario),
        color_terciario: vacio(terciario),
        color_cuaternario: vacio(cuaternario),
      })
      aplicar(row)
      toast.success("Marca actualizada.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar.")
    } finally {
      setGuardando(false)
    }
  }

  async function subirLogo(cual: "claro" | "oscuro", file: File | undefined) {
    if (!file) {
      return
    }
    setSubiendo(cual)
    try {
      const row = cual === "oscuro" ? await uploadLogoOscuroOrganizacion(file) : await uploadLogoOrganizacion(file)
      aplicar(row)
      toast.success(cual === "oscuro" ? "Logo oscuro actualizado." : "Logo actualizado.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir el logo.")
    } finally {
      setSubiendo(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Marca"
        description="Logo y colores para cotizaciones PDF, documentos generados y formulario web. La interfaz del CRM usa el theme app (Stripe); estos colores no la tiñen."
      />
      {cargando && !org ? (
        <DetailSkeleton />
      ) : (
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-section">Logo</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="surface-card p-6">
              <p className="mb-4 text-kicker">Sobre claro</p>
              <PrometioLogo className="h-8 w-auto" />
            </div>
            <div className="surface-card bg-[var(--brand-sidebar)] p-6">
              <p className="mb-4 text-kicker text-white/70">Sobre oscuro (PDF / header)</p>
              <PrometioLogo onDark className="h-8 w-auto" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="marca-logo">Logo claro</Label>
              <Input
                id="marca-logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                disabled={subiendo != null}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ""
                  void subirLogo("claro", file)
                }}
              />
              <p className="text-kicker">PNG, JPEG, WebP o SVG. Máximo 2 MB. Para fondos claros.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="marca-logo-oscuro">Logo oscuro</Label>
              <Input
                id="marca-logo-oscuro"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                disabled={subiendo != null}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ""
                  void subirLogo("oscuro", file)
                }}
              />
              <p className="text-kicker">Para el sidebar y el PDF de cotización (header oscuro). Si no hay, se usa el claro.</p>
            </div>
          </div>
        </section>
        <section className="space-y-4">
          <h2 className="text-section">Colores</h2>
          <p className="text-kicker text-muted-foreground">
            Logo y colores también alimentan el widget público del formulario web (
            <a href="/configuracion/formulario-web?tab=apariencia" className="underline-offset-4 hover:underline">
              textos y tipografía del formulario
            </a>
            ).
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField id="marca-primario" label="Color primario" value={primario} onChange={setPrimario} />
            <ColorField
              id="marca-secundario"
              label="Color secundario"
              value={secundario}
              onChange={setSecundario}
              fallbackToken="--brand-secondary"
            />
            <ColorField
              id="marca-terciario"
              label="Color terciario"
              value={terciario}
              onChange={setTerciario}
              fallbackToken="--brand-highlight"
            />
            <ColorField
              id="marca-cuaternario"
              label="Color cuaternario"
              value={cuaternario}
              onChange={setCuaternario}
              fallbackToken="--brand-sidebar"
            />
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="text-section">Vista previa entregables</h2>
          <p className="text-kicker text-muted-foreground">
            Botón y acentos en PDF de cotización y formulario web. La interfaz del CRM no usa estos colores.
          </p>
          <BrandSurface className="surface-card max-w-md space-y-4 p-6">
            <div className="rounded-lg bg-[var(--brand-sidebar)] px-4 py-3">
              <PrometioLogo onDark className="h-7 w-auto" />
            </div>
            <div>
              <p className="text-kicker text-muted-foreground">Total propuesta</p>
              <p className="text-page tabular-nums">$12.450,00</p>
            </div>
            <Button type="button">Aceptar cotización</Button>
          </BrandSurface>
        </section>
        <section className="space-y-4">
          <h2 className="text-section">Contacto</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="marca-email">Email</Label>
              <Input
                id="marca-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="hola@empresa.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="marca-telefono">Teléfono</Label>
              <Input
                id="marca-telefono"
                type="tel"
                value={telefono}
                onChange={(event) => setTelefono(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="marca-web">Sitio web</Label>
              <Input
                id="marca-web"
                value={sitio}
                onChange={(event) => setSitio(event.target.value)}
                placeholder="https://"
              />
            </div>
          </div>
          <Button type="button" disabled={guardando || !org} onClick={() => void guardar()}>
            {guardando ? "Guardando…" : "Guardar"}
          </Button>
        </section>
      </div>
      )}
    </>
  )
}

function ColorField({
  id,
  label,
  value,
  onChange,
  fallbackToken = "--brand-primary",
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  fallbackToken?: "--brand-primary" | "--brand-secondary" | "--brand-highlight" | "--brand-sidebar"
}) {
  const picker = HEX.test(value) ? value : readThemeHex(fallbackToken)
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        {picker ? (
          <input
            type="color"
            aria-label={label}
            value={picker}
            onChange={(event) => onChange(event.target.value)}
            className="size-8 shrink-0 cursor-pointer rounded-md border border-border bg-background p-0.5"
          />
        ) : (
          <span className="size-8 shrink-0 rounded-md border border-border bg-primary" aria-hidden />
        )}
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#RRGGBB"
          className="font-mono uppercase"
        />
      </div>
    </div>
  )
}
