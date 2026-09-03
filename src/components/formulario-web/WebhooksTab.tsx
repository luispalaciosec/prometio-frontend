import { useEffect, useState } from "react"
import { Webhook } from "lucide-react"
import { toast } from "sonner"

import { CopyBlock } from "@/components/conectores/CopyBlock"
import { EmptyState } from "@/components/empty-state"
import { TableSkeleton } from "@/components/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  createOrganizacionWebhook,
  deleteOrganizacionWebhook,
  listOrganizacionWebhooks,
  updateOrganizacionWebhook,
} from "@/lib/api/formulario-config"
import {
  EVENTO_WEBHOOK_FORMULARIO,
  type OrganizacionWebhook,
} from "@/types/organizacion-webhook"

const EVENTO_LABEL = "Contacto creado (formulario web)"

type Draft = {
  id?: string
  url: string
  activo: boolean
}

function draftVacio(): Draft {
  return { url: "", activo: true }
}

function esUrlValida(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export function WebhooksTab() {
  const [rows, setRows] = useState<OrganizacionWebhook[] | null>(null)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(() => draftVacio())
  const [guardando, setGuardando] = useState(false)
  const [secretoNuevo, setSecretoNuevo] = useState<string | null>(null)

  async function reload() {
    setRows(await listOrganizacionWebhooks())
  }

  useEffect(() => {
    void reload()
  }, [])

  function abrirNuevo() {
    setDraft(draftVacio())
    setOpen(true)
  }

  async function save() {
    const url = draft.url.trim()
    if (!url) {
      toast.error("La URL es obligatoria.")
      return
    }
    if (!esUrlValida(url)) {
      toast.error("La URL debe ser http:// o https://.")
      return
    }

    setGuardando(true)
    try {
      if (draft.id) {
        await updateOrganizacionWebhook(draft.id, { url, activo: draft.activo })
        toast.success("Webhook actualizado.")
        setOpen(false)
      } else {
        const created = await createOrganizacionWebhook({
          evento: EVENTO_WEBHOOK_FORMULARIO,
          url,
          activo: draft.activo,
        })
        setOpen(false)
        if (created.secreto) {
          setSecretoNuevo(created.secreto)
        }
        toast.success("Webhook creado.")
      }
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el webhook.")
    } finally {
      setGuardando(false)
    }
  }

  async function remove(id: string) {
    try {
      await deleteOrganizacionWebhook(id)
      toast.success("Webhook eliminado.")
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el webhook.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-prose space-y-2">
          <p className="text-kicker">
            POST saliente cuando un lead se crea desde el formulario web. Firma HMAC en{" "}
            <span className="font-mono text-micro">X-Prometio-Signature</span>{" "}
            (<span className="font-mono text-micro">sha256=…</span>) con el secreto generado al crear.
          </p>
          <p className="text-kicker text-muted-foreground">
            Evento fijo: <span className="font-mono text-micro">{EVENTO_WEBHOOK_FORMULARIO}</span>.
          </p>
        </div>
        <Button type="button" onClick={abrirNuevo}>
          Nuevo webhook
        </Button>
      </div>

      {rows == null ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Webhook}
          title="Sin webhooks"
          body="Agregá una URL para recibir contacto.creado_formulario cuando alguien envíe el formulario."
          action={
            <Button type="button" variant="ghost" size="sm" onClick={abrirNuevo}>
              Nuevo webhook
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead className="w-40 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="max-w-xs truncate text-ui-medium">{row.url}</TableCell>
                <TableCell className="text-ui">{EVENTO_LABEL}</TableCell>
                <TableCell>
                  <Badge variant={row.activo ? "success" : "outline"}>
                    {row.activo ? "Sí" : "No"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDraft({ id: row.id, url: row.url, activo: row.activo })
                      setOpen(true)
                    }}
                  >
                    Editar
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void remove(row.id)}>
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Editar webhook" : "Nuevo webhook"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <Label>Evento</Label>
              <p className="text-ui">{EVENTO_LABEL}</p>
              <p className="font-mono text-kicker text-muted-foreground">{EVENTO_WEBHOOK_FORMULARIO}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="webhook-url">URL de destino</Label>
              <Input
                id="webhook-url"
                value={draft.url}
                onChange={(event) => setDraft((prev) => ({ ...prev, url: event.target.value }))}
                placeholder="https://hooks.zapier.com/…"
              />
            </div>
            <label className="flex items-center gap-2 text-kicker">
              <Checkbox
                checked={draft.activo}
                onCheckedChange={(checked) =>
                  setDraft((prev) => ({ ...prev, activo: checked === true }))
                }
              />
              Activo
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={guardando} onClick={() => void save()}>
              {guardando ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={secretoNuevo != null} onOpenChange={(next) => !next && setSecretoNuevo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Secreto del webhook</DialogTitle>
          </DialogHeader>
          <p className="text-kicker text-muted-foreground">
            {secretoNuevo
              ? "Copialo ahora. No se vuelve a mostrar en esta pantalla — usalo para verificar X-Prometio-Signature."
              : "El secreto HMAC se generó en el servidor. No es recuperable por API; si no lo guardaste al crear, eliminá el webhook y volvé a crearlo."}
          </p>
          {secretoNuevo ? <CopyBlock label="Secreto HMAC" value={secretoNuevo} /> : null}
          <DialogFooter>
            <Button type="button" onClick={() => setSecretoNuevo(null)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
