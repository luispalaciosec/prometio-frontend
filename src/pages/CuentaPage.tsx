import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { CalendarDays } from "lucide-react"
import { toast } from "sonner"

import { KindMark } from "@/components/kind-mark"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getEstadoCalendar } from "@/lib/api/google-calendar"
import { iniciarConexionCalendar } from "@/lib/google-oauth"
import { puedeVerModuloVentas } from "@/lib/pipeline-acceso"
import { isSupabaseConfigured } from "@/lib/supabase"
import { useAuthStore } from "@/store/auth-store"
import type { EstadoCalendar } from "@/types/google-calendar"
import type { Equipo, RolVentas } from "@/types/perfil"

const EQUIPO_LABEL: Record<Equipo, string> = {
  administrativo: "Administrativo",
  ventas: "Ventas",
  marketing: "Marketing",
}

const ROL_LABEL: Record<RolVentas, string> = {
  vendedor: "Vendedor",
  supervisor: "Supervisor",
}

type CalendarLocationState = {
  calendarOk?: boolean
  calendarError?: string
}

export function CuentaPage() {
  const perfil = useAuthStore((state) => state.perfil)
  const location = useLocation()
  const puedeCalendar = perfil ? puedeVerModuloVentas(perfil) : false
  const [estado, setEstado] = useState<EstadoCalendar | null>(null)
  const [conectando, setConectando] = useState(false)

  useEffect(() => {
    const state = location.state as CalendarLocationState | null
    if (state?.calendarOk) {
      toast.success("Google Calendar conectado.")
    } else if (state?.calendarError) {
      toast.error(state.calendarError)
    }
    if (state?.calendarOk || state?.calendarError) {
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  useEffect(() => {
    if (!puedeCalendar) {
      return
    }
    let cancelled = false
    void getEstadoCalendar()
      .then((row) => {
        if (!cancelled) {
          setEstado(row)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "No se pudo leer el estado de Calendar.")
          setEstado({ conectado: false, google_email: null })
        }
      })
    return () => {
      cancelled = true
    }
  }, [puedeCalendar])

  async function conectar() {
    if (!isSupabaseConfigured) {
      toast.error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el entorno.")
      return
    }
    setConectando(true)
    try {
      await iniciarConexionCalendar()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir Google.")
      setConectando(false)
    }
  }

  const equipo = perfil ? EQUIPO_LABEL[perfil.equipo] : "—"
  const rol = perfil?.rol_ventas ? ROL_LABEL[perfil.rol_ventas] : null

  return (
    <>
      <PageHeader
        title="Mi cuenta"
        description="Datos de tu perfil. La conexión de Calendar es tuya, no de la organización."
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

        {puedeCalendar ? (
          <section className="rounded-xl p-4 ring-1 ring-border">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <KindMark icon={CalendarDays} tone="bg-muted text-muted-foreground" size="lg" label="Google Calendar" />
                {estado == null ? (
                  <p className="text-kicker">Leyendo el estado…</p>
                ) : estado.conectado ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="success">Conectado</Badge>
                    {estado.google_email ? <p className="text-kicker">{estado.google_email}</p> : null}
                  </div>
                ) : (
                  <p className="max-w-prose text-kicker">
                    Las visitas y videollamadas programadas se crean en tu Calendar. El login de prometIO no alcanza:
                    Google pide el permiso una vez, con consentimiento.
                  </p>
                )}
              </div>
              {estado && !estado.conectado ? (
                <Button type="button" onClick={() => void conectar()} disabled={conectando}>
                  {conectando ? "Abriendo Google…" : "Conectar"}
                </Button>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </>
  )
}
