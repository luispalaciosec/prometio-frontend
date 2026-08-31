import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { ListSkeleton } from "@/components/skeleton"
import { BandejaHilo } from "@/components/bandeja/BandejaHilo"
import { BandejaLista } from "@/components/bandeja/BandejaLista"
import { ConvertirContactoDialog } from "@/components/bandeja/ConvertirContactoDialog"
import { ReasignarConversacionDialog } from "@/components/bandeja/ReasignarConversacionDialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ApiError, extraerUuid } from "@/lib/api-client"
import {
  cerrarConversacion,
  convertirConversacion,
  enviarMensaje,
  getConversacion,
  listConversaciones,
  reabrirConversacion,
  reclamarConversacion,
  reasignarConversacion,
} from "@/lib/api/conversacion"
import { listPerfiles } from "@/lib/api/perfiles"
import { puedeVerEquipo } from "@/lib/pipeline-acceso"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import type {
  BandejaScope,
  Conversacion,
  ConvertirConversacionInput,
} from "@/types/conversacion"
import type { Perfil } from "@/types/perfil"
import { ChevronLeft, Inbox } from "lucide-react"

function esElegibleBandeja(perfil: Perfil): boolean {
  return perfil.activo && (perfil.equipo === "ventas" || perfil.equipo === "marketing")
}

export function BandejaPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const perfil = useAuthStore((state) => state.perfil)
  const mostrarAlcance = perfil ? puedeVerEquipo(perfil) : false
  const [scope, setScope] = useState<BandejaScope>("mias")
  const [todas, setTodas] = useState<Conversacion[]>([])
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [cargando, setCargando] = useState(true)
  const [convertirOpen, setConvertirOpen] = useState(false)
  const [reasignarOpen, setReasignarOpen] = useState(false)
  const [convertirError, setConvertirError] = useState<string | null>(null)
  const [duplicadoId, setDuplicadoId] = useState<string | null>(null)
  const [convirtiendo, setConvirtiendo] = useState(false)

  const reload = useCallback(async () => {
    setCargando(true)
    try {
      const [rows, catalogo] = await Promise.all([listConversaciones(), listPerfiles()])
      setTodas(rows)
      setPerfiles(catalogo)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la bandeja.")
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const nombresAsignados = useMemo(() => {
    return new Map(perfiles.map((row) => [row.id, row.nombre_completo]))
  }, [perfiles])

  const visibles = useMemo(() => {
    if (!mostrarAlcance || scope === "equipo" || !perfil) {
      return todas
    }
    return todas.filter((row) => row.asignado_a === null || row.asignado_a === perfil.id)
  }, [todas, mostrarAlcance, scope, perfil])

  const seleccionada = visibles.find((row) => row.id === id) ?? null

  async function refrescarSeleccion(conversacionId: string) {
    try {
      const fresh = await getConversacion(conversacionId)
      setTodas((prev) => {
        const sin = prev.filter((row) => row.id !== conversacionId)
        return [fresh, ...sin]
      })
    } catch {
      await reload()
    }
  }

  async function reclamar() {
    if (!id) {
      return
    }
    try {
      await reclamarConversacion(id)
      await refrescarSeleccion(id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo reclamar.")
      await reload()
    }
  }

  async function reasignar(nuevo_asignado_a: string) {
    if (!id) {
      return
    }
    try {
      await reasignarConversacion(id, nuevo_asignado_a)
      setReasignarOpen(false)
      await refrescarSeleccion(id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo reasignar.")
    }
  }

  async function cerrar() {
    if (!id) {
      return
    }
    try {
      await cerrarConversacion(id)
      await refrescarSeleccion(id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cerrar.")
    }
  }

  async function reabrir() {
    if (!id) {
      return
    }
    try {
      await reabrirConversacion(id)
      await refrescarSeleccion(id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo reabrir.")
    }
  }

  async function convertir(body: ConvertirConversacionInput) {
    if (!id) {
      return
    }
    setConvirtiendo(true)
    setConvertirError(null)
    try {
      await convertirConversacion(id, body)
      setConvertirOpen(false)
      setDuplicadoId(null)
      toast.success("Conversación convertida a contacto.")
      await refrescarSeleccion(id)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const existente = extraerUuid(error.detail)
        if (existente && /tel[eé]fono/i.test(error.detail)) {
          setDuplicadoId(existente)
          setConvertirError(error.detail)
          return
        }
      }
      setConvertirError(error instanceof Error ? error.message : "No se pudo convertir.")
    } finally {
      setConvirtiendo(false)
    }
  }

  async function enviar(contenido: string) {
    if (!id) {
      return
    }
    try {
      await enviarMensaje(id, contenido)
      await refrescarSeleccion(id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo enviar.")
      throw error
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="flex items-start gap-2">
          {id ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="mt-1 md:hidden"
              aria-label="Volver a la lista"
              onClick={() => navigate("/bandeja")}
            >
              <ChevronLeft />
            </Button>
          ) : null}
          <div>
            <h1 className="text-page">Bandeja</h1>
            <p className="text-kicker">
              Una conversación no es un contacto hasta que la conviertas.
            </p>
          </div>
        </div>
        {mostrarAlcance ? (
          <div className="flex flex-col gap-1">
            <Label className="sr-only">Alcance</Label>
            <div className="flex flex-wrap gap-1">
              <Button
                type="button"
                size="sm"
                variant={scope === "mias" ? "default" : "outline"}
                onClick={() => setScope("mias")}
              >
                Mías + sin asignar
              </Button>
              <Button
                type="button"
                size="sm"
                variant={scope === "equipo" ? "default" : "outline"}
                onClick={() => setScope("equipo")}
              >
                Todo el equipo
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            "min-h-0 overflow-y-auto border-border md:w-80 md:shrink-0 md:border-r",
            id ? "hidden md:block" : "w-full",
          )}
        >
          {cargando ? (
            <ListSkeleton />
          ) : (
            <BandejaLista
              conversaciones={visibles}
              seleccionId={id ?? null}
              nombresAsignados={nombresAsignados}
              onSelect={(next) => navigate(`/bandeja/${next}`)}
            />
          )}
        </aside>
        <section className={cn("min-w-0 flex-1", id ? "flex" : "hidden md:flex")}>
          {cargando && id ? (
            <ListSkeleton rows={4} />
          ) : seleccionada ? (
            <BandejaHilo
              conversacion={seleccionada}
              nombreAsignado={
                seleccionada.asignado_a
                  ? (nombresAsignados.get(seleccionada.asignado_a) ?? null)
                  : null
              }
              puedeReasignar={mostrarAlcance}
              onReclamar={() => void reclamar()}
              onReasignar={() => setReasignarOpen(true)}
              onCerrar={() => void cerrar()}
              onReabrir={() => void reabrir()}
              onConvertir={() => {
                setDuplicadoId(null)
                setConvertirError(null)
                setConvertirOpen(true)
              }}
              onEnviar={enviar}
            />
          ) : (
            <EmptyState
              icon={Inbox}
              title="Elegí una conversación"
              body="El hilo y las acciones viven acá. Una conversación no es un contacto hasta que la conviertas."
            />
          )}
        </section>
      </div>
      <ConvertirContactoDialog
        open={convertirOpen}
        conversacion={seleccionada}
        duplicadoId={duplicadoId}
        enviando={convirtiendo}
        error={convertirError}
        onSubmit={(body) => void convertir(body)}
        onCancel={() => {
          setConvertirOpen(false)
          setDuplicadoId(null)
          setConvertirError(null)
        }}
      />
      <ReasignarConversacionDialog
        open={reasignarOpen}
        conversacion={seleccionada}
        perfiles={perfiles.filter(esElegibleBandeja)}
        onConfirm={(nuevo) => void reasignar(nuevo)}
        onCancel={() => setReasignarOpen(false)}
      />
    </div>
  )
}
