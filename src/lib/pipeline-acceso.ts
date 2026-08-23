import type { Perfil } from "@/types/perfil"
import type { PipelineScope } from "@/types/oportunidad"

/** Matriz de acceso DATA_MODEL: marketing no entra al módulo de ventas. */
export function puedeVerModuloVentas(perfil: Perfil): boolean {
  return perfil.equipo === "administrativo" || perfil.equipo === "ventas"
}

/** Espejo de `require_acceso_marketing`: admin o marketing. */
export function puedeVerModuloMarketing(perfil: Perfil): boolean {
  return perfil.equipo === "administrativo" || perfil.equipo === "marketing"
}

/** Destino válido de reasignación: activo y del módulo de ventas (admin o ventas). */
export function esPerfilElegibleEjecutivo(perfil: Perfil): boolean {
  return perfil.activo && puedeVerModuloVentas(perfil)
}

/** Espejo de `es_solo_lo_propio`: vendedor ve/edita solo lo suyo. */
export function esSoloLoPropio(perfil: Perfil): boolean {
  return perfil.equipo === "ventas" && perfil.rol_ventas === "vendedor"
}

/** Toggle «todo el equipo»: administrativo, o ventas-supervisor. El vendedor no. */
export function puedeVerEquipo(perfil: Perfil): boolean {
  if (perfil.equipo === "administrativo") {
    return true
  }
  return perfil.equipo === "ventas" && perfil.rol_ventas === "supervisor"
}

/** Desglose de margen/comisión y PDF interno: dueño, o admin/supervisor. */
export function puedeVerDesgloseCotizacion(perfil: Perfil, ejecutivoId: string): boolean {
  return puedeVerEquipo(perfil) || perfil.id === ejecutivoId
}

/**
 * RLS del mock: el vendedor siempre queda en «mio», aunque el caller pida «equipo».
 * Supervisor/admin respetan el scope pedido; default «equipo».
 */
export function scopeEfectivo(
  perfil: Perfil,
  requested?: PipelineScope,
): PipelineScope {
  if (!puedeVerEquipo(perfil)) {
    return "mio"
  }
  return requested ?? "equipo"
}
