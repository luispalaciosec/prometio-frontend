import { useEffect, useState } from "react"
import { toast } from "sonner"

import { PrometioLogo } from "@/components/prometio-logo"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  getOrganizacion,
  updateOrganizacion,
  uploadLogoOrganizacion,
  uploadLogoOscuroOrganizacion,
} from "@/lib/api/organizacion"
import { applyOrganizationTheme, readThemeHex } from "@/lib/theme"
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
    applyOrganizationTheme({
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
  }, [])

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
        description="Logo, colores y contacto de la organización. Se aplican en toda la app."
      />
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-section">Logo</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-background p-6 ring-1 ring-border">
              <p className="mb-4 text-kicker">Sobre claro</p>
              <PrometioLogo className="h-8 w-auto" />
            </div>
            <div className="rounded-xl bg-sidebar p-6">
              <p className="mb-4 text-kicker text-sidebar-foreground/60">Sobre oscuro (sidebar)</p>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField id="marca-primario" label="Color primario" value={primario} onChange={setPrimario} />
            <ColorField
              id="marca-secundario"
              label="Color secundario"
              value={secundario}
              onChange={setSecundario}
              fallbackToken="--secondary"
            />
            <ColorField
              id="marca-terciario"
              label="Color terciario"
              value={terciario}
              onChange={setTerciario}
              fallbackToken="--highlight"
            />
            <ColorField
              id="marca-cuaternario"
              label="Color cuaternario"
              value={cuaternario}
              onChange={setCuaternario}
              fallbackToken="--sidebar"
            />
          </div>
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
    </>
  )
}

function ColorField({
  id,
  label,
  value,
  onChange,
  fallbackToken = "--primary",
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  fallbackToken?: "--primary" | "--secondary" | "--highlight" | "--sidebar"
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
