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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { listContactos, listEmpresasParaContacto } from "@/lib/api/contacto"
import type { Contacto } from "@/types/contacto"
import type { Conversacion, ConvertirConversacionInput } from "@/types/conversacion"

type Camino = "nuevo" | "vincular"

function etiquetaContacto(row: Contacto): string {
  const extra = [row.email_trabajo, row.telefono_movil].filter(Boolean).join(" · ")
  return extra ? `${row.nombre_completo} · ${extra}` : row.nombre_completo
}

export function ConvertirContactoDialog({
  open,
  conversacion,
  duplicadoId,
  enviando,
  error,
  onSubmit,
  onCancel,
}: {
  open: boolean
  conversacion: Conversacion | null
  duplicadoId: string | null
  enviando: boolean
  error: string | null
  onSubmit: (body: ConvertirConversacionInput) => void
  onCancel: () => void
}) {
  const [camino, setCamino] = useState<Camino>("nuevo")
  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [email, setEmail] = useState("")
  const [empresaId, setEmpresaId] = useState("")
  const [empresas, setEmpresas] = useState<{ id: string; nombre: string }[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [qDebounced, setQDebounced] = useState("")
  const [resultados, setResultados] = useState<Contacto[]>([])
  const [buscando, setBuscando] = useState(false)
  const [elegido, setElegido] = useState<Contacto | null>(null)

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
    setEmpresaId("")
    setBusqueda("")
    setQDebounced("")
    setResultados([])
    setElegido(null)
    void listEmpresasParaContacto()
      .then(setEmpresas)
      .catch(() => setEmpresas([]))
  }, [open, conversacion?.id])

  useEffect(() => {
    const t = window.setTimeout(() => setQDebounced(busqueda), 300)
    return () => window.clearTimeout(t)
  }, [busqueda])

  useEffect(() => {
    if (!open || camino !== "vincular") {
      return
    }
    const q = qDebounced.trim()
    if (q.length < 2) {
      setResultados([])
      setBuscando(false)
      return
    }
    let cancelled = false
    setBuscando(true)
    void listContactos({ q })
      .then((rows) => {
        if (!cancelled) {
          setResultados(rows)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResultados([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBuscando(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [open, camino, qDebounced])

  function empresaBody(): string | null {
    return empresaId.trim() === "" ? null : empresaId
  }

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
        <div className="flex flex-col gap-2">
          <Label htmlFor="conv-empresa">Empresa</Label>
          <Select
            value={empresaId || "none"}
            onValueChange={(value) => setEmpresaId(value === "none" ? "" : value)}
          >
            <SelectTrigger id="conv-empresa">
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
          <p className="text-kicker">
            Opcional. Si la elegís, se crea una oportunidad en Clasificación y se asigna sola al
            ejecutivo.
          </p>
        </div>
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
          <div className="space-y-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="conv-buscar">Buscar contacto</Label>
              <Input
                id="conv-buscar"
                value={busqueda}
                onChange={(event) => {
                  setBusqueda(event.target.value)
                  setElegido(null)
                }}
                placeholder="Nombre, email o teléfono"
              />
            </div>
            {elegido ? (
              <p className="text-ui-medium">{etiquetaContacto(elegido)}</p>
            ) : qDebounced.trim().length < 2 ? (
              <p className="text-kicker">Escribí al menos 2 caracteres.</p>
            ) : buscando ? (
              <p className="text-kicker">Buscando…</p>
            ) : resultados.length === 0 ? (
              <p className="text-kicker">Ningún contacto coincide.</p>
            ) : (
              <ul className="max-h-40 overflow-y-auto rounded-xl ring-1 ring-border">
                {resultados.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-muted/50"
                      onClick={() => setElegido(row)}
                    >
                      <span className="text-ui-medium">{row.nombre_completo}</span>
                      <span className="text-kicker">
                        {[row.email_trabajo, row.telefono_movil].filter(Boolean).join(" · ") || "—"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
              onClick={() =>
                onSubmit({ contacto_id: duplicadoId, empresa_id: empresaBody() })
              }
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
            disabled={enviando || (camino === "vincular" && !elegido)}
            onClick={() => {
              if (camino === "vincular") {
                if (!elegido) {
                  return
                }
                onSubmit({ contacto_id: elegido.id, empresa_id: empresaBody() })
                return
              }
              onSubmit({
                nombre_completo: nombre.trim() || null,
                telefono_movil: telefono.trim() || null,
                email_trabajo: email.trim() || null,
                empresa_id: empresaBody(),
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
