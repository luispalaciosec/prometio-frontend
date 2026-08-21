/**
 * Fachada de perfiles. Hoy lee de Supabase; cuando exista GET /perfiles se cambia este archivo.
 */
import { listPerfiles } from "../perfil-api"
import { esPerfilElegibleEjecutivo } from "../pipeline-acceso"
import type { Perfil } from "@/types/perfil"

export async function listPerfilesElegiblesEjecutivo(): Promise<Perfil[]> {
  const rows = await listPerfiles()
  return rows.filter(esPerfilElegibleEjecutivo)
}

export { fetchPerfil, listPerfiles } from "../perfil-api"
export { esPerfilElegibleEjecutivo } from "../pipeline-acceso"
