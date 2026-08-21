import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { Conversacion, ConvertirConversacionInput } from "@/types/conversacion"

type Camino = "nuevo" | "vincular"

export function ConvertirContactoDialog({
  open,
  conversacion,
  duplicadoId,
  enviando,
  error,
  onSubmit,
  onVincularDuplicado,
  onCancel,
}: {
  open: boolean
  conversacion: Conversacion | null
  duplicadoId: string | null
  enviando: boolean
  error: string | null
  onSubmit: (body: ConvertirConversacionInput) => void
  onVincularDuplicado: (contactoId: string) => void
  onCancel: () => void
}) {
  const [camino, setCamino] = useState<Camino>("nuevo")
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [email, setEmail] = useState("")
  const [contactoId, setContactoId] = useState("")

  useEffect(() => {
    if (!open || !conversacion) {
      return
    }
    setCamino("nuevo")
    setNombre(conversacion.remitente_nombre ?? "")
    setTelefono(
      conversacion.canal === "whatsapp" ? (conversacion.remitente_identificador ?? "") : "",
    )
    setEmail("")
    setContactoId("")
  }, [open, conversacion?.id])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onCancel()
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convertir a contacto</DialogTitle>
          <DialogDescription>
            La conversación no es un contacto hasta que confirmes. Nada se crea solo.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup
          value={camino}
          onValueChange={(value) => setCamino(value as Camino)}
          className="gap-3"
        >
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="nuevo" id="camino-nuevo" />
            Crear uno nuevo
          </label>
          <label className="flex items-center gap-2 text-sm">
            <RadioGroupItem value="vincular" id="camino-vincular" />
            Vincular a un contacto existente
          </label>
        </RadioGroup>
        {camino === "nuevo" ? (
          <div className="space-y-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="conv-nombre">Nombre completo</Label>
              <Input
                id="conv-nombre"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="conv-tel">Teléfono móvil</Label>
              <Input
                id="conv-tel"
                value={telefono}
                onChange={(event) => setTelefono(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="conv-email">Email de trabajo</Label>
              <Input
                id="conv-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Label htmlFor="conv-id">contacto_id</Label>
            <Input
              id="conv-id"
              value={contactoId}
              onChange={(event) => setContactoId(event.target.value)}
              placeholder="Pegá el UUID del contacto"
            />
            <p className="text-xs text-muted-foreground">
              Todavía no hay búsqueda de contactos. Cuando exista ese endpoint, este campo se
              reemplaza por un buscador.
            </p>
          </div>
        )}
        {duplicadoId ? (
          <div className="space-y-2 rounded-lg bg-warning/10 p-3 text-sm">
            <p>
              Ya existe un contacto con este teléfono:{" "}
              <code className="text-xs">{duplicadoId}</code>
            </p>
            <Button
              type="button"
              size="sm"
              disabled={enviando}
              onClick={() => onVincularDuplicado(duplicadoId)}
            >
              Vincular a este contacto
            </Button>
          </div>
        ) : null}
        {error && !duplicadoId ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={enviando}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={enviando}
            onClick={() => {
              if (camino === "vincular") {
                onSubmit({ contacto_id: contactoId.trim() || null })
                return
              }
              onSubmit({
                nombre_completo: nombre.trim() || null,
                telefono_movil: telefono.trim() || null,
                email_trabajo: email.trim() || null,
              })
            }}
          >
            Convertir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
