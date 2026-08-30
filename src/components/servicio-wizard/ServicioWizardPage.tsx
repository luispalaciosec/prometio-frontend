import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { DetailSkeleton } from "@/components/skeleton"
import {
  PASO_TITULO,
  PasoConfigFee,
  PasoDatosBasicos,
  PasoDocumentos,
  PasoEquipoCosteo,
  PasoFases,
  PasoMargenes,
  PasoModeloCobro,
  PasoRevision,
  pasosVisibles,
  type WizardPaso,
} from "@/components/servicio-wizard/wizard-pasos"
import { Button } from "@/components/ui/button"
import {
  MOCK_ORGANIZACION_ID,
  activarServicio,
  archivarServicio,
  getConfiguracionGeneral,
  getServicio,
  listCategoriasServicio,
  listTarifasInternas,
  listTiposDocumento,
  upsertServicio,
  upsertTipoDocumento,
} from "@/lib/config-api"
import { HORAS_LABORALES_MES_DEFAULT } from "@/lib/costo-interno"
import { useAuthStore } from "@/store/auth-store"
import type { CategoriaServicio } from "@/types/categoria-servicio"
import type { ConfiguracionGeneral } from "@/types/configuracion-general"
import type { Servicio } from "@/types/servicio"
import type { TarifaInterna } from "@/types/tarifa-interna"
import type { TipoDocumento } from "@/types/tipo-documento"

function blankServicio(
  organizacion_id: string,
  created_by: string,
  defaults: ConfiguracionGeneral | null,
): Servicio {
  return {
    id: "",
    organizacion_id,
    nombre: "",
    descripcion: null,
    categoria_id: null,
    categoria_nombre: null,
    pilar: null,
    modelo_cobro: "por_hora",
    tiene_fases: false,
    precio_base_cliente: null,
    estimacion_interna_por_rol: {},
    fases: null,
    config_fee: null,
    margen_default_pct: defaults?.margen_agencia_default_pct ?? null,
    comision_sugerida_min_pct: defaults?.comision_agencia_default_min_pct ?? null,
    comision_sugerida_max_pct: defaults?.comision_agencia_default_max_pct ?? null,
    tipos_documento_requeridos: [],
    estado: "borrador",
    created_by,
    created_at: new Date().toISOString(),
    contifico_producto_id: null,
  }
}

export function ServicioWizardPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const perfil = useAuthStore((state) => state.perfil)
  const isAdmin = perfil?.equipo === "administrativo"

  const [draft, setDraft] = useState<Servicio | null>(null)
  const [paso, setPaso] = useState<WizardPaso>(1)
  const [tarifas, setTarifas] = useState<TarifaInterna[]>([])
  const [tipos, setTipos] = useState<TipoDocumento[]>([])
  const [defaults, setDefaults] = useState<ConfiguracionGeneral | null>(null)
  const [categorias, setCategorias] = useState<CategoriaServicio[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const organizacion_id = perfil?.organizacion_id ?? MOCK_ORGANIZACION_ID
    const created_by = perfil?.id ?? "unknown"

    void Promise.all([
      listTarifasInternas(),
      listTiposDocumento(),
      getConfiguracionGeneral(),
      listCategoriasServicio(),
      id ? getServicio(id) : Promise.resolve(null),
    ]).then(([tarifasRows, tiposRows, general, categoriasRows, existing]) => {
      setTarifas(tarifasRows)
      setTipos(tiposRows)
      setDefaults(general)
      setCategorias(categoriasRows)
      setDraft(existing ?? blankServicio(organizacion_id, created_by, general))
    })
  }, [id, perfil])

  const visibles = useMemo(
    () => (draft ? pasosVisibles(draft) : []),
    [draft],
  )

  useEffect(() => {
    if (draft && !visibles.includes(paso)) {
      setPaso(visibles[0] ?? 1)
    }
  }, [draft, paso, visibles])

  if (!draft) {
    return <DetailSkeleton />
  }

  const current = draft
  const indice = visibles.indexOf(paso)
  const esUltimo = indice === visibles.length - 1
  const archivado = current.estado === "archivado"
  const horasLaboralesMes = defaults?.horas_laborales_mes ?? HORAS_LABORALES_MES_DEFAULT

  function update(updater: (prev: Servicio) => Servicio) {
    setDraft((prev) => (prev ? updater(prev) : prev))
  }

  function payload(): Omit<Servicio, "id" | "created_at"> & { id?: string; created_at?: string } {
    const feeApplies =
      current.modelo_cobro === "fee_fijo" || current.modelo_cobro === "fee_recurrente"
    return {
      id: current.id || undefined,
      organizacion_id: current.organizacion_id,
      nombre: current.nombre,
      descripcion: current.descripcion,
      categoria_id: current.categoria_id,
      pilar: current.pilar,
      modelo_cobro: current.modelo_cobro,
      tiene_fases: current.tiene_fases,
      precio_base_cliente: current.precio_base_cliente,
      estimacion_interna_por_rol: current.estimacion_interna_por_rol,
      fases: current.tiene_fases ? current.fases : null,
      config_fee: feeApplies ? current.config_fee : null,
      margen_default_pct: current.margen_default_pct,
      comision_sugerida_min_pct: current.comision_sugerida_min_pct,
      comision_sugerida_max_pct: current.comision_sugerida_max_pct,
      tipos_documento_requeridos: current.tipos_documento_requeridos,
      estado: "borrador",
      created_by: current.created_by,
      created_at: current.created_at,
    }
  }

  async function saveDraft() {
    if (archivado) {
      toast.error("No se puede editar un servicio archivado.")
      return null
    }
    if (!current.nombre.trim()) {
      toast.error("El nombre es obligatorio para guardar el borrador.")
      return null
    }
    if (!current.id && !current.pilar) {
      toast.error("El pilar es obligatorio en servicios nuevos.")
      return null
    }
    setSaving(true)
    try {
      const saved = await upsertServicio(payload())
      setDraft(saved)
      if (!id) {
        navigate(`/configuracion/servicios/${saved.id}`, { replace: true })
      }
      toast.success("Borrador guardado.")
      return saved
    } finally {
      setSaving(false)
    }
  }

  async function activar() {
    const saved = await saveDraft()
    if (!saved) {
      return
    }
    const activo = await activarServicio(saved.id)
    setDraft(activo)
    toast.success("Servicio activado.")
    navigate("/configuracion/servicios")
  }

  async function archivar() {
    if (!current.id) {
      return
    }
    setSaving(true)
    try {
      const row = await archivarServicio(current.id)
      setDraft(row)
      toast.success("Servicio archivado.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo archivar el servicio.")
    } finally {
      setSaving(false)
    }
  }

  async function crearTipo(nombre: string) {
    const created = await upsertTipoDocumento({
      organizacion_id: current.organizacion_id,
      nombre,
      plantilla_base: null,
    })
    setTipos(await listTiposDocumento())
    update((prev) => ({
      ...prev,
      tipos_documento_requeridos: [...(prev.tipos_documento_requeridos ?? []), created.id],
    }))
    toast.success("Tipo de documento creado.")
  }

  function siguiente() {
    const next = visibles[indice + 1]
    if (next) {
      setPaso(next)
    }
  }

  function atras() {
    const prev = visibles[indice - 1]
    if (prev) {
      setPaso(prev)
    }
  }

  return (
    <>
      <PageHeader
        title={draft.id ? draft.nombre || "Borrador" : "Nuevo servicio"}
        description={
          <>
            {archivado ? <span>Archivado</span> : null}
            <span>
              {PASO_TITULO[paso]} · paso {indice + 1} de {visibles.length}
            </span>
          </>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" disabled={saving || archivado} onClick={() => void saveDraft()}>
              Guardar borrador
            </Button>
            {isAdmin && current.id && !archivado ? (
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void archivar()}
              >
                Archivar
              </Button>
            ) : null}
          </div>
        }
      />

      <ol className="mb-8 flex flex-wrap gap-2 text-kicker">
        {visibles.map((item) => (
          <li key={item}>
            <button
              type="button"
              onClick={() => setPaso(item)}
              className={
                item === paso
                  ? "rounded-full bg-foreground px-2.5 py-1 text-background"
                  : "rounded-full bg-muted px-2.5 py-1 text-muted-foreground"
              }
            >
              {item}. {PASO_TITULO[item]}
            </button>
          </li>
        ))}
      </ol>

      {paso === 1 ? (
        <PasoDatosBasicos
          draft={draft}
          setDraft={update}
          categorias={categorias}
          esNuevo={!draft.id}
        />
      ) : null}
      {paso === 2 ? <PasoModeloCobro draft={draft} setDraft={update} /> : null}
      {paso === 3 ? (
        <PasoEquipoCosteo
          draft={draft}
          setDraft={update}
          tarifas={tarifas}
          horasLaboralesMes={horasLaboralesMes}
        />
      ) : null}
      {paso === 4 ? <PasoConfigFee draft={draft} setDraft={update} /> : null}
      {paso === 5 ? <PasoFases draft={draft} setDraft={update} /> : null}
      {paso === 6 ? (
        <PasoMargenes draft={draft} setDraft={update} defaults={defaults} />
      ) : null}
      {paso === 7 ? (
        <PasoDocumentos
          draft={draft}
          setDraft={update}
          tipos={tipos}
          onCreateTipo={crearTipo}
        />
      ) : null}
      {paso === 8 ? (
        <PasoRevision draft={draft} tarifas={tarifas} horasLaboralesMes={horasLaboralesMes} />
      ) : null}

      <div className="mt-8 flex items-center gap-2">
        <Button variant="outline" disabled={indice === 0} onClick={atras}>
          Atrás
        </Button>
        {!esUltimo ? <Button onClick={siguiente}>Siguiente</Button> : null}
        {esUltimo && isAdmin && !archivado ? (
          <Button disabled={saving} onClick={() => void activar()}>
            Activar servicio
          </Button>
        ) : null}
      </div>
    </>
  )
}
