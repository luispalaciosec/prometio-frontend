import { supabase } from "@/lib/supabase"
import type { Perfil } from "@/types/perfil"

const PERFIL_COLUMNS =
  "id, organizacion_id, nombre_completo, email, equipo, rol_ventas, tema_preferido, activo, created_at"

export async function fetchPerfil(userId: string): Promise<Perfil | null> {
  const { data, error } = await supabase
    .from("perfil")
    .select(PERFIL_COLUMNS)
    .eq("id", userId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data as Perfil
}

export async function listPerfiles(): Promise<Perfil[]> {
  const { data, error } = await supabase.from("perfil").select(PERFIL_COLUMNS)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Perfil[]
}
