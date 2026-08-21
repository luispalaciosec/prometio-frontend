import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatDateTime } from "@/lib/datetime-local"
import { cn } from "@/lib/utils"
import { CANAL_LABELS, type CanalConversacion, type Conversacion } from "@/types/conversacion"

export function BandejaHilo({
  conversacion,
  nombreAsignado,
  puedeReasignar,
  onReclamar,
  onReasignar,
  onCerrar,
  onReabrir,
  onConvertir,
  onEnviar,
}: {
  conversacion: Conversacion
  nombreAsignado: string | null
  puedeReasignar: boolean
  onReclamar: () => void
  onReasignar: () => void
  onCerrar: () => void
  onReabrir: () => void
  onConvertir: () => void
  onEnviar: (contenido: string) => Promise<void>
}) {
  const [borrador, setBorrador] = useState("")
  const [enviando, setEnviando] = useState(false)
  const sinAsignar = conversacion.asignado_a === null
  const abierta = conversacion.estado === "abierta"
  const mensajes = [...conversacion.mensajes].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
  const canal = CANAL_LABELS[conversacion.canal as CanalConversacion] ?? conversacion.canal

  async function enviar() {
    const contenido = borrador.trim()
    if (!contenido || enviando || !abierta) {
      return
    }
    setEnviando(true)
    try {
      await onEnviar(contenido)
      setBorrador("")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 space-y-3 border-b border-border px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg tracking-tight">
              {conversacion.remitente_nombre ?? conversacion.remitente_identificador ?? "Sin nombre"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {canal}
              {conversacion.remitente_identificador
                ? ` · ${conversacion.remitente_identificador}`
                : ""}
              {" · "}
              {conversacion.estado}
              {" · "}
              {sinAsignar ? "Sin asignar" : (nombreAsignado ?? "Asignada")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {sinAsignar ? (
              <Button type="button" size="sm" onClick={onReclamar}>
                Reclamar
              </Button>
            ) : null}
            {!sinAsignar && puedeReasignar ? (
              <Button type="button" size="sm" variant="outline" onClick={onReasignar}>
                Reasignar
              </Button>
            ) : null}
            {abierta ? (
              <Button type="button" size="sm" variant="outline" onClick={onCerrar}>
                Cerrar
              </Button>
            ) : (
              <Button type="button" size="sm" variant="outline" onClick={onReabrir}>
                Reabrir
              </Button>
            )}
            {conversacion.contacto_id === null ? (
              <Button type="button" size="sm" variant="secondary" onClick={onConvertir}>
                Convertir a contacto
              </Button>
            ) : null}
          </div>
        </div>
      </header>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {mensajes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Esta conversación no tiene mensajes todavía.</p>
        ) : (
          mensajes.map((mensaje) => {
            const saliente = mensaje.direccion === "saliente"
            return (
              <div key={mensaje.id} className={cn("flex", saliente ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-xl px-3 py-2 text-sm",
                    saliente
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap">{mensaje.contenido || "—"}</p>
                  <p
                    className={cn(
                      "mt-1 text-[0.7rem]",
                      saliente ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    {formatDateTime(mensaje.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
      <form
        className="shrink-0 border-t border-border p-4"
        onSubmit={(event) => {
          event.preventDefault()
          void enviar()
        }}
      >
        <Textarea
          value={borrador}
          onChange={(event) => setBorrador(event.target.value)}
          placeholder={abierta ? "Escribí un mensaje…" : "Reabrí la conversación para enviar."}
          disabled={!abierta || enviando}
          rows={3}
        />
        <div className="mt-2 flex justify-end">
          <Button type="submit" size="sm" disabled={!abierta || enviando || borrador.trim() === ""}>
            Enviar
          </Button>
        </div>
      </form>
    </div>
  )
}
