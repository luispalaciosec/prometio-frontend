import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ETAPAS_CICLO_VIDA,
  ETAPA_CICLO_LABELS,
  type ContactoCreate,
  type EtapaCicloVida,
} from "@/types/contacto"

const VACIO: ContactoCreate = {
  nombre_completo: "",
  email_trabajo: "",
  telefono_movil: "",
  empresa_id: "",
  producto_interes: "",
  ciudad: "",
  provincia: "",
  linkedin_url: "",
  fecha_nacimiento: "",
  cargo: "",
  etapa_ciclo_vida: "contacto",
}

export function ContactoAltaDialog({
  open,
  enviando,
  empresas,
  onConfirm,
  onCancel,
}: {
  open: boolean
  enviando: boolean
  empresas: { id: string; nombre: string }[]
  onConfirm: (input: ContactoCreate) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<ContactoCreate>(VACIO)

  useEffect(() => {
    if (open) {
      setDraft(VACIO)
    }
  }, [open])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          if (enviando) {
            return
          }
          setDraft(VACIO)
          onCancel()
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo contacto</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="ct-nombre">Nombre completo</Label>
            <Input
              id="ct-nombre"
              value={draft.nombre_completo}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, nombre_completo: event.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ct-email">Email de trabajo</Label>
            <Input
              id="ct-email"
              type="email"
              value={draft.email_trabajo ?? ""}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, email_trabajo: event.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ct-tel">Teléfono móvil</Label>
            <Input
              id="ct-tel"
              value={draft.telefono_movil ?? ""}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, telefono_movil: event.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ct-empresa">Empresa</Label>
            <Select
              value={draft.empresa_id || "none"}
              onValueChange={(value) =>
                setDraft((prev) => ({ ...prev, empresa_id: value === "none" ? "" : value }))
              }
            >
              <SelectTrigger id="ct-empresa">
                <SelectValue placeholder="Sin empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin empresa</SelectItem>
                {empresas.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ct-etapa">Etapa</Label>
            <Select
              value={draft.etapa_ciclo_vida ?? "contacto"}
              onValueChange={(value) =>
                setDraft((prev) => ({ ...prev, etapa_ciclo_vida: value as EtapaCicloVida }))
              }
            >
              <SelectTrigger id="ct-etapa">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ETAPAS_CICLO_VIDA.map((etapa) => (
                  <SelectItem key={etapa} value={etapa}>
                    {ETAPA_CICLO_LABELS[etapa]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ct-prod">Producto de interés</Label>
            <Input
              id="ct-prod"
              value={draft.producto_interes ?? ""}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, producto_interes: event.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ct-ciudad">Ciudad</Label>
            <Input
              id="ct-ciudad"
              value={draft.ciudad ?? ""}
              onChange={(event) => setDraft((prev) => ({ ...prev, ciudad: event.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ct-prov">Provincia</Label>
            <Input
              id="ct-prov"
              value={draft.provincia ?? ""}
              onChange={(event) => setDraft((prev) => ({ ...prev, provincia: event.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ct-cargo">Cargo</Label>
            <Input
              id="ct-cargo"
              value={draft.cargo ?? ""}
              onChange={(event) => setDraft((prev) => ({ ...prev, cargo: event.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ct-fnac">Fecha de nacimiento</Label>
            <Input
              id="ct-fnac"
              type="date"
              value={draft.fecha_nacimiento ?? ""}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, fecha_nacimiento: event.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="ct-li">LinkedIn</Label>
            <Input
              id="ct-li"
              value={draft.linkedin_url ?? ""}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, linkedin_url: event.target.value }))
              }
              placeholder="https://www.linkedin.com/in/…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={enviando}
            onClick={() => {
              setDraft(VACIO)
              onCancel()
            }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={enviando || draft.nombre_completo.trim() === ""}
            onClick={() => onConfirm(draft)}
          >
            {enviando ? "Creando…" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
