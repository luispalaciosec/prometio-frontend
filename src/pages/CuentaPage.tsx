import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { CalendarDays, Tent } from "lucide-react"
import { toast } from "sonner"

import { KindMark } from "@/components/kind-mark"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getEstadoBasecamp } from "@/lib/api/basecamp"
import { getEstadoCalendar } from "@/lib/api/google-calendar"
import { iniciarConexionBasecamp } from "@/lib/basecamp-oauth"
import { iniciarConexionCalendar } from "@/lib/google-oauth"
import { puedeVerModuloVentas } from "@/lib/pipeline-acceso"
import { isSupabaseConfigured } from "@/lib/supabase"
import { useAuthStore } from "@/store/auth-store"
import type { EstadoBasecamp } from "@/types/basecamp"
import type { EstadoCalendar } from "@/types/google-calendar"
import type { RolVentas } from "@/types/perfil"
import { EQUIPO_LABELS } from "@/types/perfil"

const ROL_LABEL: Record<RolVentas, string> = {
  vendedor: "Vendedor",
  supervisor: "Supervisor",
}

type CuentaLocationState = {
  calendarOk?: boolean
  calendarError?: string
  basecampOk?: boolean
  basecampError?: string
}

export function CuentaPage() {
  const perfil = useAuthStore((state) => state.perfil)
  const location = useLocation()
  const puedeIntegraciones = perfil ? puedeVerModuloVentas(perfil) : false
  const [estadoCalendar, setEstadoCalendar] = useState<EstadoCalendar | null>(null)
  const [estadoBasecamp, setEstadoBasecamp] = useState<EstadoBasecamp | null>(null)
  const [conectandoCalendar, setConectandoCalendar] = useState(false)
  const [conectandoBasecamp, setConectandoBasecamp] = useState(false)

  useEffect(() => {
    const state = location.state as CuentaLocationState | null
    if (state?.calendarOk) {
      toast.success("Google Calendar conectado.")
    } else if (state?.calendarError) {
      toast.error(state.calendarError)
    }
    if (state?.basecampOk) {
      toast.success("Basecamp conectado.")
    } else if (state?.basecampError) {
      toast.error(state.basecampError)
    }
    if (state?.calendarOk || state?.calendarError || state?.basecampOk || state?.basecampError) {
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  useEffect(() => {
    if (!puedeIntegraciones) {
      return
    }
    let cancelled = false
    void getEstadoCalendar()
      .then((row) => {
        if (!cancelled) {
          setEstadoCalendar(row)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "No se pudo leer el estado de Calendar.")
          setEstadoCalendar({ conectado: false, google_email: null })
        }
      })
    void getEstadoBasecamp()
      .then((row) => {
        if (!cancelled) {
          setEstadoBasecamp(row)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "No se pudo leer el estado de Basecamp.")
          setEstadoBasecamp({
            conectado: false,
            basecamp_email: null,
            basecamp_nombre: null,
            basecamp_avatar_url: null,
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [puedeIntegraciones])

  async function conectarCalendar() {
    if (!isSupabaseConfigured) {
      toast.error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el entorno.")
      return
    }
    setConectandoCalendar(true)
    try {
      await iniciarConexionCalendar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir Google.")
      setConectandoCalendar(false)
    }
  }

  function conectarBasecamp() {
    setConectandoBasecamp(true)
    try {
      iniciarConexionBasecamp()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir Basecamp.")
      setConectandoBasecamp(false)
    }
  }

  const equipo = perfil ? EQUIPO_LABELS[perfil.equipo] : "—"
  const rol = perfil?.rol_ventas ? ROL_LABEL[perfil.rol_ventas] : null

  return (
    <>
      <PageHeader
        title="Mi cuenta"
        description="Datos de tu perfil. Calendar y Basecamp son tuyos, no de la organización."
      />
      <div className="space-y-4">
        <section className="rounded-xl p-4 ring-1 ring-border">
          <h2 className="text-section">Perfil</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-kicker">Nombre</dt>
              <dd className="text-ui-medium">{perfil?.nombre_completo ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-kicker">Email</dt>
              <dd className="text-ui-medium">{perfil?.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-kicker">Equipo</dt>
              <dd className="text-ui-medium">{rol ? `${equipo} · ${rol}` : equipo}</dd>
            </div>
          </dl>
        </section>

        {puedeIntegraciones ? (
          <section className="rounded-xl p-4 ring-1 ring-border">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <KindMark icon={CalendarDays} tone="bg-muted text-muted-foreground" size="lg" label="Google Calendar" />
                {estadoCalendar == null ? (
                  <p className="text-kicker">Leyendo el estado…</p>
                ) : estadoCalendar.conectado ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="success">Conectado</Badge>
                    {estadoCalendar.google_email ? (
                      <p className="text-kicker">{estadoCalendar.google_email}</p>
                    ) : (
                      <p className="text-kicker">Sin email todavía. Reconectá para actualizarlo.</p>
                    )}
                  </div>
                ) : (
                  <p className="max-w-prose text-kicker">
                    Las visitas y videollamadas programadas se crean en tu Calendar. El login de prometIO no alcanza:
                    Google pide el permiso una vez, con consentimiento.
                  </p>
                )}
              </div>
              {estadoCalendar ? (
                <Button type="button" onClick={() => void conectarCalendar()} disabled={conectandoCalendar}>
                  {conectandoCalendar
                    ? "Abriendo Google…"
                    : estadoCalendar.conectado
                      ? "Reconectar"
                      : "Conectar"}
                </Button>
              ) : null}
            </div>
          </section>
        ) : null}

        {puedeIntegraciones ? (
          <section className="rounded-xl p-4 ring-1 ring-border">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <KindMark icon={Tent} tone="bg-muted text-muted-foreground" size="lg" label="Basecamp" />
                {estadoBasecamp == null ? (
                  <p className="text-kicker">Leyendo el estado…</p>
                ) : estadoBasecamp.conectado ? (
                  <>
                    {estadoBasecamp.basecamp_avatar_url || estadoBasecamp.basecamp_nombre ? (
                      <div className="flex min-w-0 items-center gap-2">
                        {estadoBasecamp.basecamp_avatar_url ? (
                          <img
                            src={estadoBasecamp.basecamp_avatar_url}
                            alt=""
                            className="size-8 shrink-0 rounded-lg object-cover ring-1 ring-border"
                          />
                        ) : null}
                        {estadoBasecamp.basecamp_nombre ? (
                          <p className="truncate text-ui-medium">{estadoBasecamp.basecamp_nombre}</p>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="success">Conectado</Badge>
                      {estadoBasecamp.basecamp_email ? (
                        <p className="text-kicker">{estadoBasecamp.basecamp_email}</p>
                      ) : (
                        <p className="text-kicker">
                          {estadoBasecamp.basecamp_nombre || estadoBasecamp.basecamp_avatar_url
                            ? "Sin email todavía. Reconectá para actualizarlo."
                            : "Sin datos de perfil. Reconectá para actualizarlos."}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="max-w-prose text-kicker">
                    Conectá tu usuario de Basecamp para mostrar tu nombre y foto en prometIO. El permiso es tuyo, no de
                    la organización.
                  </p>
                )}
              </div>
              {estadoBasecamp ? (
                <Button type="button" onClick={conectarBasecamp} disabled={conectandoBasecamp}>
                  {conectandoBasecamp
                    ? "Abriendo Basecamp…"
                    : estadoBasecamp.conectado
                      ? "Reconectar"
                      : "Conectar"}
                </Button>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </>
  )
}
