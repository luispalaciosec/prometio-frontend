import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"

import { EntityAvatar } from "@/components/entity-avatar"
import { LinkedInLink } from "@/components/linkedin-link"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { enriquecerEmpresa, getEmpresa, updateEmpresa } from "@/lib/api/empresa"
import { puedeEnriquecer, type Empresa } from "@/types/empresa"

export function EmpresaPage() {
  const { id } = useParams()
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nombre, setNombre] = useState("")
  const [web, setWeb] = useState("")
  const [direccion, setDireccion] = useState("")
  const [ruc, setRuc] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [enriqueciendo, setEnriqueciendo] = useState(false)

  async function reload(empresaId: string) {
    setEmpresa(null)
    setError(null)
    try {
      const row = await getEmpresa(empresaId)
      setEmpresa(row)
      setNombre(row.nombre)
      setWeb(row.web ?? "")
      setDireccion(row.direccion ?? "")
      setRuc(row.ruc ?? "")
      setError(null)
    } catch (err) {
      setEmpresa(null)
      setError(err instanceof Error ? err.message : "No se pudo cargar la empresa.")
    }
  }

  useEffect(() => {
    if (!id) {
      return
    }
    void reload(id)
  }, [id])

  async function guardar() {
    if (!id) {
      return
    }
    setGuardando(true)
    try {
      const row = await updateEmpresa(id, { nombre, web, direccion, ruc })
      setEmpresa(row)
      toast.success("Empresa actualizada.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.")
    } finally {
      setGuardando(false)
    }
  }

  async function enriquecer() {
    if (!id) {
      return
    }
    setEnriqueciendo(true)
    try {
      const row = await enriquecerEmpresa(id)
      setEmpresa(row)
      toast.success("Enriquecimiento listo.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falló el enriquecimiento.")
      await reload(id)
    } finally {
      setEnriqueciendo(false)
    }
  }

  if (error) {
    return (
      <div className="max-w-md space-y-3">
        <h1 className="font-heading text-2xl tracking-tight">No se pudo cargar</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button asChild variant="outline">
          <Link to="/empresas">Volver a empresas</Link>
        </Button>
      </div>
    )
  }

  if (!empresa) {
    return <p className="text-sm text-muted-foreground">Cargando empresa…</p>
  }

  const google = empresa.datos_enriquecidos.google_resultados ?? []
  const errorEnrich = empresa.datos_enriquecidos.enriquecimiento_error
  const mostrarEnriquecer = puedeEnriquecer(empresa)

  return (
    <>
      <PageHeader
        leading={
          <EntityAvatar
            name={empresa.nombre}
            seed={empresa.id}
            kind="empresa"
            size="xl"
            src={empresa.logo_url}
          />
        }
        title={empresa.nombre}
        description={empresa.linkedin_url ? <LinkedInLink href={empresa.linkedin_url} /> : undefined}
        action={
          <div className="flex gap-2">
            {mostrarEnriquecer ? (
              <Button type="button" disabled={enriqueciendo} onClick={() => void enriquecer()}>
                {enriqueciendo ? "Enriqueciendo…" : "Enriquecer"}
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link to="/empresas">Volver</Link>
            </Button>
          </div>
        }
      />
      <section className="mb-10 space-y-4">
        <h2 className="font-heading text-base tracking-tight">Datos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="det-nombre">Nombre</Label>
            <Input id="det-nombre" value={nombre} onChange={(event) => setNombre(event.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="det-web">Web</Label>
            <Input id="det-web" value={web} onChange={(event) => setWeb(event.target.value)} />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="det-dir">Dirección</Label>
            <Input
              id="det-dir"
              value={direccion}
              onChange={(event) => setDireccion(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="det-ruc">RUC</Label>
            <Input id="det-ruc" value={ruc} onChange={(event) => setRuc(event.target.value)} />
          </div>
        </div>
        <Button type="button" disabled={guardando || nombre.trim() === ""} onClick={() => void guardar()}>
          Guardar
        </Button>
      </section>
      <section className="space-y-3">
        <h2 className="font-heading text-base tracking-tight">Enriquecimiento</h2>
        {errorEnrich ? (
          <p className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning">{errorEnrich}</p>
        ) : null}
        {mostrarEnriquecer && !errorEnrich ? (
          <p className="text-sm text-muted-foreground">Todavía no hay datos — Enriquecer.</p>
        ) : null}
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Sector" value={empresa.sector} />
          <Field label="Tamaño estimado" value={empresa.tamano_estimado} />
          <div className="flex flex-col gap-1 sm:col-span-2">
            <dt className="text-xs text-muted-foreground">LinkedIn</dt>
            <dd className="text-sm">
              {empresa.linkedin_url ? (
                <LinkedInLink href={empresa.linkedin_url} />
              ) : empresa.datos_enriquecidos.linkedin_sin_resultados ? (
                "Sin resultados en LinkedIn"
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
        {google.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Resultados Google</h3>
            <ul className="space-y-2">
              {google.map((item, index) => (
                <li key={`${item.url ?? "g"}-${index}`} className="rounded-lg p-3 ring-1 ring-border">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {item.title || item.url}
                    </a>
                  ) : (
                    <p className="text-sm font-medium">{item.title || "Sin título"}</p>
                  )}
                  {item.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  )
}
