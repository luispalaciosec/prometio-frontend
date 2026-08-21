/**
 * Mock de GET /alertas. Solo oportunidades en alerta o escalada.
 * Sin configuracion_general: 200 con alertas normales; nunca escalada.
 */
import { getConfiguracionGeneral, listEtapasPipeline } from "@/lib/mock-config"
import { listOportunidades } from "@/lib/mock-oportunidad"
import type { Alerta, EstadoAlerta } from "@/types/alerta"
import type { Perfil } from "@/types/perfil"

export async function listAlertas(perfil: Perfil): Promise<Alerta[]> {
  const [oportunidades, etapas, config] = await Promise.all([
    listOportunidades({ perfil, scope: "equipo" }),
    listEtapasPipeline(),
    getConfiguracionGeneral(),
  ])
  const umbralPorCodigo = new Map(etapas.map((etapa) => [etapa.codigo, etapa.umbral_alerta_horas]))
  const ahora = Date.now()
  const multiplicador = config?.multiplicador_escalamiento_supervisor ?? null

  const alertas: Alerta[] = []
  for (const oportunidad of oportunidades) {
    const umbral = umbralPorCodigo.get(oportunidad.etapa)
    if (umbral == null) {
      continue
    }
    const fecha = oportunidad.fecha_ultima_actividad ?? oportunidad.created_at
    const horas_transcurridas = (ahora - new Date(fecha).getTime()) / 3_600_000
    const estado = estadoAlerta(horas_transcurridas, umbral, multiplicador)
    if (!estado) {
      continue
    }
    alertas.push({
      oportunidad_id: oportunidad.id,
      etapa: oportunidad.etapa,
      ejecutivo_id: oportunidad.ejecutivo_id,
      contacto_id: oportunidad.contacto_id,
      empresa_id: oportunidad.empresa_id,
      fecha_ultima_actividad: fecha,
      horas_transcurridas,
      umbral_alerta_horas: umbral,
      estado_alerta: estado,
    })
  }

  return alertas.sort((a, b) => b.horas_transcurridas - a.horas_transcurridas)
}

function estadoAlerta(
  horas: number,
  umbral: number,
  multiplicador: number | null,
): EstadoAlerta | null {
  if (multiplicador != null && horas >= umbral * multiplicador) {
    return "escalada"
  }
  if (horas >= umbral) {
    return "alerta"
  }
  return null
}
