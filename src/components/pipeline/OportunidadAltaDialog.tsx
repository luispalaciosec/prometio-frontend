import { useEffect, useState } from "react"

import { CategoriaInteresPicker } from "@/components/pipeline/CategoriaInteresPicker"
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
import type { CategoriaServicio } from "@/types/categoria-servicio"
import type { Contacto } from "@/types/contacto"
import type { Empresa } from "@/types/empresa"
import type { OportunidadCreate } from "@/types/oportunidad"

type Draft = {
  contacto_id: string
  empresa_id: string
  valor_referencial: string
  categoria_interes_id: string | null
}

const VACIO: Draft = {
  contacto_id: "",
  empresa_id: "",
  valor_referencial: "",
  categoria_interes_id: null,
}

export function OportunidadAltaDialog({
  open,
  enviando,
  contactos,
  empresas,
  categorias,
  onConfirm,
  onCancel,
}: {
  open: boolean
  enviando: boolean
  contactos: Contacto[]
  empresas: Empresa[]
  categorias: CategoriaServicio[]
  onConfirm: (input: OportunidadCreate) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<Draft>(VACIO)

  useEffect(() => {
    if (open) {
      setDraft(VACIO)
    }
  }, [open])

  function elegirContacto(contactoId: string) {
    const contacto = contactos.find((row) => row.id === contactoId)
    setDraft((prev) => ({
      ...prev,
      contacto_id: contactoId,
      empresa_id: contacto?.empresa_id ?? prev.empresa_id,
    }))
  }

  const valorOk =
    draft.valor_referencial.trim() === "" || Number.isFinite(Number(draft.valor_referencial))
  const puedeCrear =
    draft.contacto_id !== "" && draft.empresa_id !== "" && valorOk && !enviando

  function confirmar() {
    if (!puedeCrear) {
      return
    }
    const valor = draft.valor_referencial.trim()
    onConfirm({
      contacto_id: draft.contacto_id,
      empresa_id: draft.empresa_id,
      valor_referencial: valor === "" ? null : Number(valor),
      categoria_interes_id: draft.categoria_interes_id,
    })
  }

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
      <DialogContent className="rounded-2xl shadow-modal sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva oportunidad</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="opp-contacto">Contacto</Label>
            <Select value={draft.contacto_id || undefined} onValueChange={elegirContacto}>
              <SelectTrigger id="opp-contacto">
                <SelectValue placeholder="Elegí un contacto" />
              </SelectTrigger>
              <SelectContent>
                {contactos.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.nombre_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {contactos.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Primero creá un contacto. La oportunidad entra en Clasificación.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Entra en Clasificación, a tu nombre. El valor es estimado hasta que haya cotización.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="opp-empresa">Empresa</Label>
            <Select
              value={draft.empresa_id || undefined}
              onValueChange={(value) => setDraft((prev) => ({ ...prev, empresa_id: value }))}
            >
              <SelectTrigger id="opp-empresa">
                <SelectValue placeholder="Elegí una empresa" />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="opp-valor">Valor estimado</Label>
            <Input
              id="opp-valor"
              inputMode="decimal"
              value={draft.valor_referencial}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, valor_referencial: event.target.value }))
              }
              placeholder="Opcional"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Interés comercial</Label>
            <CategoriaInteresPicker
              categorias={categorias}
              value={draft.categoria_interes_id}
              onChange={(categoria_interes_id) =>
                setDraft((prev) => ({ ...prev, categoria_interes_id }))
              }
              disabled={enviando}
            />
            <p className="text-xs text-muted-foreground">
              Clasificación liviana — sin costos ni catálogo. El servicio concreto se elige al cotizar.
            </p>
          </div>
        </div>
        <DialogFooter className="rounded-b-2xl">
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
          <Button type="button" disabled={!puedeCrear} onClick={confirmar}>
            {enviando ? "Creando…" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
