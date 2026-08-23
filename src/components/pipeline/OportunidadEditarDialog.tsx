import { useEffect, useMemo, useState } from "react"

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
import type { Contacto } from "@/types/contacto"
import type { Empresa } from "@/types/empresa"
import type { OportunidadKanban, OportunidadUpdate } from "@/types/oportunidad"
import type { Servicio } from "@/types/servicio"

type Draft = {
  contacto_id: string
  empresa_id: string
  valor_referencial: string
  servicio_id: string
}

function draftDesde(oportunidad: OportunidadKanban): Draft {
  return {
    contacto_id: oportunidad.contacto_id,
    empresa_id: oportunidad.empresa_id,
    valor_referencial:
      oportunidad.valor_referencial != null ? String(oportunidad.valor_referencial) : "",
    servicio_id: oportunidad.servicios_ids[0] ?? "",
  }
}

export function OportunidadEditarDialog({
  open,
  enviando,
  oportunidad,
  contactos,
  empresas,
  servicios,
  onConfirm,
  onCancel,
}: {
  open: boolean
  enviando: boolean
  oportunidad: OportunidadKanban | null
  contactos: Contacto[]
  empresas: Empresa[]
  servicios: Servicio[]
  onConfirm: (input: OportunidadUpdate) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<Draft>({
    contacto_id: "",
    empresa_id: "",
    valor_referencial: "",
    servicio_id: "",
  })
  const contactosOpciones = useMemo(() => {
    if (!oportunidad || contactos.some((row) => row.id === oportunidad.contacto_id)) {
      return contactos
    }
    return [
      { id: oportunidad.contacto_id, nombre_completo: oportunidad.contacto.nombre_completo },
      ...contactos,
    ]
  }, [contactos, oportunidad])
  const empresasOpciones = useMemo(() => {
    if (!oportunidad || empresas.some((row) => row.id === oportunidad.empresa_id)) {
      return empresas
    }
    return [{ id: oportunidad.empresa_id, nombre: oportunidad.empresa.nombre }, ...empresas]
  }, [empresas, oportunidad])
  const catalogo = useMemo(() => {
    const visibles = servicios.filter((row) => row.estado !== "archivado")
    const actual = servicios.find((row) => row.id === draft.servicio_id)
    if (actual && !visibles.some((row) => row.id === actual.id)) {
      return [actual, ...visibles]
    }
    return visibles
  }, [servicios, draft.servicio_id])

  useEffect(() => {
    if (open && oportunidad) {
      setDraft(draftDesde(oportunidad))
    }
  }, [open, oportunidad])

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
  const puedeGuardar =
    draft.contacto_id !== "" && draft.empresa_id !== "" && valorOk && !enviando

  function confirmar() {
    if (!puedeGuardar) {
      return
    }
    const valor = draft.valor_referencial.trim()
    onConfirm({
      contacto_id: draft.contacto_id,
      empresa_id: draft.empresa_id,
      valor_referencial: valor === "" ? null : Number(valor),
      servicios_ids: draft.servicio_id ? [draft.servicio_id] : null,
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
          onCancel()
        }
      }}
    >
      <DialogContent className="rounded-2xl shadow-modal sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar oportunidad</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="opp-edit-contacto">Contacto</Label>
            <Select value={draft.contacto_id || undefined} onValueChange={elegirContacto}>
              <SelectTrigger id="opp-edit-contacto">
                <SelectValue placeholder="Elegí un contacto" />
              </SelectTrigger>
              <SelectContent>
                {contactosOpciones.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.nombre_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="opp-edit-empresa">Empresa</Label>
            <Select
              value={draft.empresa_id || undefined}
              onValueChange={(value) => setDraft((prev) => ({ ...prev, empresa_id: value }))}
            >
              <SelectTrigger id="opp-edit-empresa">
                <SelectValue placeholder="Elegí una empresa" />
              </SelectTrigger>
              <SelectContent>
                {empresasOpciones.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="opp-edit-valor">Valor estimado</Label>
            <Input
              id="opp-edit-valor"
              inputMode="decimal"
              value={draft.valor_referencial}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, valor_referencial: event.target.value }))
              }
              placeholder="Opcional"
            />
            {oportunidad?.valor_cotizado != null ? (
              <p className="text-xs text-muted-foreground">
                El pipeline muestra el valor cotizado. Esto solo cambia el estimado.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Se muestra como estimado hasta que haya una cotización en firme.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="opp-edit-servicio">Servicio</Label>
            <Select
              value={draft.servicio_id || "none"}
              onValueChange={(value) =>
                setDraft((prev) => ({ ...prev, servicio_id: value === "none" ? "" : value }))
              }
            >
              <SelectTrigger id="opp-edit-servicio">
                <SelectValue placeholder="Sin servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin servicio</SelectItem>
                {catalogo.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="rounded-b-2xl">
          <Button type="button" variant="outline" disabled={enviando} onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" disabled={!puedeGuardar} onClick={confirmar}>
            {enviando ? "Guardando…" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
