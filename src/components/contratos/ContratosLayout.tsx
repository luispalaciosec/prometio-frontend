import { useEffect, useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { ContratoNuevoDialog } from "@/components/contratos/ContratoNuevoDialog"
import { GenerarMesDialog } from "@/components/contratos/GenerarMesDialog"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { listCategoriasServicio, listServicios } from "@/lib/config-api"
import { puedeVerEquipo } from "@/lib/pipeline-acceso"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import type { CategoriaServicio } from "@/types/categoria-servicio"
import type { Servicio } from "@/types/servicio"

/** Lo que el layout comparte con Contratos / Renovaciones / Proyección. */
export type ContratosOutletContext = {
  servicios: Servicio[]
  categorias: CategoriaServicio[]
  /** Cambia tras crear un contrato o generar un mes: las pestañas recargan. */
  version: number
  recargar: () => void
}

function tabClass({ isActive }: { isActive: boolean }) {
  return cn(
    "rounded-full px-3 py-1.5 text-kicker transition-colors",
    isActive ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
  )
}

export function ContratosLayout() {
  const navigate = useNavigate()
  const perfil = useAuthStore((state) => state.perfil)
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [categorias, setCategorias] = useState<CategoriaServicio[]>([])
  const [version, setVersion] = useState(0)
  const [nuevoAbierto, setNuevoAbierto] = useState(false)
  const [generarAbierto, setGenerarAbierto] = useState(false)

  useEffect(() => {
    let cancelled = false
    void Promise.all([listServicios(), listCategoriasServicio()])
      .then(([serviciosRows, categoriasRows]) => {
        if (!cancelled) {
          setServicios(serviciosRows)
          setCategorias(categoriasRows)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "No se pudo cargar el catálogo de servicios.")
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const context: ContratosOutletContext = {
    servicios,
    categorias,
    version,
    recargar: () => setVersion((value) => value + 1),
  }

  return (
    <>
      <PageHeader
        title="Contratos"
        description="Fees recurrentes: lo que se cobra cada mes, cuándo renovar y el piso de facturación."
        action={
          <div className="flex flex-wrap gap-2">
            {perfil && puedeVerEquipo(perfil) ? (
              <Button type="button" variant="outline" onClick={() => setGenerarAbierto(true)}>
                Generar mes
              </Button>
            ) : null}
            <Button type="button" onClick={() => setNuevoAbierto(true)}>
              <Plus className="size-4" strokeWidth={1.75} aria-hidden />
              Nuevo contrato
            </Button>
          </div>
        }
      />
      <nav aria-label="Sección Contratos" className="mb-6 flex flex-wrap gap-2 border-b border-border pb-4">
        <NavLink to="/contratos" end className={tabClass}>
          Contratos
        </NavLink>
        <NavLink to="/contratos/renovaciones" className={tabClass}>
          Renovaciones
        </NavLink>
        <NavLink to="/contratos/proyeccion" className={tabClass}>
          Proyección
        </NavLink>
      </nav>
      <Outlet context={context} />
      <ContratoNuevoDialog
        open={nuevoAbierto}
        servicios={servicios}
        categorias={categorias}
        onCancel={() => setNuevoAbierto(false)}
        onCreated={(contrato) => {
          setNuevoAbierto(false)
          toast.success("Contrato creado.")
          navigate(`/contratos/${contrato.id}`)
        }}
      />
      <GenerarMesDialog
        open={generarAbierto}
        onClose={() => setGenerarAbierto(false)}
        onGenerado={() => setVersion((value) => value + 1)}
      />
    </>
  )
}
