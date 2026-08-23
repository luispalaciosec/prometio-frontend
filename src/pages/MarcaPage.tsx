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
} from "@/lib/api/organizacion"
import { applyOrganizationTheme, readThemeHex } from "@/lib/theme"
import { useOrgStore } from "@/store/org-store"
import type { Organizacion } from "@/types/organizacion"

const HEX = /^#[0-9A-Fa-f]{6}$/

function vacio(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

export function MarcaPage() {
  const setOrganizacion = useOrgStore((state) => state.setOrganizacion)
  const [org, setOrg] = useState<Organizacion | null>(null)
  const [sitio, setSitio] = useState("")
  const [primario, setPrimario] = useState("")
  const [secundario, setSecundario] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)

  function aplicar(row: Organizacion) {
    setOrg(row)
    setSitio(row.sitio_web_url ?? "")
    setPrimario(row.color_primario ?? "")
    setSecundario(row.color_secundario ?? "")
    setOrganizacion(row)
    applyOrganizationTheme({
      primary: row.color_primario,
      secondary: row.color_secundario,
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
    if (primario && !HEX.test(primario)) {
      toast.error("El color primario debe ser un hex #RRGGBB.")
      return
    }
    if (secundario && !HEX.test(secundario)) {
      toast.error("El color secundario debe ser un hex #RRGGBB.")
      return
    }
    setGuardando(true)
    try {
      const row = await updateOrganizacion({
        sitio_web_url: vacio(sitio),
        color_primario: vacio(primario),
        color_secundario: vacio(secundario),
      })
      aplicar(row)
      toast.success("Marca actualizada.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar.")
    } finally {
      setGuardando(false)
    }
  }

  async function subirLogo(file: File | undefined) {
    if (!file) {
      return
    }
    setSubiendo(true)
    try {
      const row = await uploadLogoOrganizacion(file)
      aplicar(row)
      toast.success("Logo actualizado.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir el logo.")
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Marca"
        description="Logo y colores de la organización. Se aplican en toda la app."
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
              <p className="mb-4 text-xs text-sidebar-foreground/60">Sobre oscuro (sidebar)</p>
              <PrometioLogo onDark className="h-8 w-auto" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="marca-logo">Subir logo</Label>
            <Input
              id="marca-logo"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              disabled={subiendo}
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ""
                void subirLogo(file)
              }}
            />
            <p className="text-kicker">PNG, JPEG, WebP o SVG. Máximo 2 MB.</p>
          </div>
        </section>
        <section className="space-y-4">
          <h2 className="text-section">Colores</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField
              id="marca-primario"
              label="Color primario"
              value={primario}
              onChange={setPrimario}
            />
            <ColorField
              id="marca-secundario"
              label="Color secundario"
              value={secundario}
              onChange={setSecundario}
            />
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
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const picker = HEX.test(value) ? value : readThemeHex("--primary")
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
