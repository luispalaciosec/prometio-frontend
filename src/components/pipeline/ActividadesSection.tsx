import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { ActividadForm, type ActividadFormValores } from "@/components/pipeline/ActividadForm"
import { ActividadLista } from "@/components/pipeline/ActividadLista"
import { Button } from "@/components/ui/button"
import {
  createActividad,
  deleteActividad,
  listActividades,
  reportarActividad,
  sincronizarCalendar,
  updateActividad,
} from "@/lib/api/actividad"
import { useAuthStore } from "@/store/auth-store"
import type { Actividad, TipoActividad } from "@/types/actividad"

export function ActividadesSection({
  oportunidadId,
  contactoId,
  listarPor = "oportunidad",
  reportarInicial,
}: {
  /** En la ficha de contacto, la oportunidad a la que atar lo nuevo, si se llegó desde un lead que la tiene. */
  oportunidadId: string | null
  contactoId: string | null
  listarPor?: "oportunidad" | "contacto"
  /** Abre el alta en modo reportar; `tipo` la preselecciona. */
  reportarInicial?: { tipo?: TipoActividad }
}) {
  const perfil = useAuthStore((state) => state.perfil)
  const [actividades, setActividades] = useState<Actividad[] | null>(null)
  const [alta, setAlta] = useState<"programar" | "reportar" | null>(reportarInicial ? "reportar" : null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [reportandoId, setReportandoId] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!perfil) {
      return
    }
    const filtro =
      listarPor === "contacto"
        ? { contacto_id: contactoId ?? undefined }
        : { oportunidad_id: oportunidadId ?? undefined }
    setActividades(filtro.contacto_id || filtro.oportunidad_id ? await listActividades({ perfil, ...filtro }) : [])
  }, [perfil, listarPor, oportunidadId, contactoId])

  useEffect(() => {
    void reload().catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar las actividades.")
      setActividades([])
    })
  }, [reload])

  function resetAcciones() {
    setAlta(null)
    setEditandoId(null)
    setReportandoId(null)
  }

  async function crear(modo: "programar" | "reportar", input: ActividadFormValores) {
    if (!perfil) {
      return
    }
    try {
      await createActividad({
        perfil,
        tipo: input.tipo,
        oportunidad_id: oportunidadId,
        contacto_id: contactoId,
        programada_para: modo === "programar" ? input.programada_para : null,
        reportada_en: modo === "reportar" ? input.reportada_en : null,
        feedback: modo === "reportar" ? input.feedback : null,
      })
      resetAcciones()
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la actividad.")
    }
  }

  async function guardarEdicion(id: string, input: ActividadFormValores) {
    if (!perfil) {
      return
    }
    try {
      await updateActividad({
        perfil,
        id,
        tipo: input.tipo,
        programada_para: input.programada_para,
        reportada_en: input.reportada_en,
        feedback: input.feedback,
      })
      resetAcciones()
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la actividad.")
    }
  }

  async function confirmarReporte(id: string, input: { reportada_en: string; feedback: string }) {
    if (!perfil) {
      return
    }
    try {
      await reportarActividad({
        perfil,
        id,
        reportada_en: input.reportada_en,
        feedback: input.feedback,
      })
      resetAcciones()
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo reportar la actividad.")
    }
  }

  async function sincronizar(id: string) {
    try {
      await sincronizarCalendar(id)
      toast.success("Sincronizada con Calendar.")
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo sincronizar con Calendar.")
    }
  }

  async function borrar(id: string) {
    if (!perfil) {
      return
    }
    try {
      await deleteActividad({ perfil, id })
      if (editandoId === id || reportandoId === id) {
        resetAcciones()
      }
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo borrar la actividad.")
    }
  }

  return (
    <section className="surface-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-section">Actividades</h2>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={alta === "programar" ? "secondary" : "outline"}
            onClick={() => {
              setEditandoId(null)
              setReportandoId(null)
              setAlta((prev) => (prev === "programar" ? null : "programar"))
            }}
          >
            Programar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditandoId(null)
              setReportandoId(null)
              setAlta((prev) => (prev === "reportar" ? null : "reportar"))
            }}
          >
            Reportar
          </Button>
        </div>
      </div>
      {alta ? (
        <div className="mb-4">
          <ActividadForm
            key={alta}
            modo={alta}
            tipoInicial={alta === "reportar" ? reportarInicial?.tipo : undefined}
            onSubmit={(input) => void crear(alta, input)}
            onCancel={() => setAlta(null)}
          />
        </div>
      ) : null}
      <ActividadLista
        actividades={actividades ?? []}
        cargando={actividades == null}
        onProgramar={() => {
          setEditandoId(null)
          setReportandoId(null)
          setAlta("programar")
        }}
        editandoId={editandoId}
        reportandoId={reportandoId}
        onEditar={(id) => {
          setAlta(null)
          setReportandoId(null)
          setEditandoId(id)
        }}
        onReportar={(id) => {
          setAlta(null)
          setEditandoId(null)
          setReportandoId(id)
        }}
        onBorrar={(id) => void borrar(id)}
        onGuardarEdicion={(id, input) => void guardarEdicion(id, input)}
        onConfirmarReporte={(id, input) => void confirmarReporte(id, input)}
        onSincronizar={(id) => void sincronizar(id)}
        onCancelar={resetAcciones}
      />
    </section>
  )
}
