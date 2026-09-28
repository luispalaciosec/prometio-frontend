import type { TemaFormulario, TipografiaFormulario } from "@/types/organizacion"

export const TIPOGRAFIA_FORMULARIO_LABELS: Record<TipografiaFormulario, string> = {
  sistema: "Sistema (sans-serif del navegador)",
  inter: "Inter",
  poppins: "Poppins",
  outfit: "Outfit (geométrica)",
  dm_sans: "DM Sans",
}

export const TEMA_FORMULARIO_LABELS: Record<TemaFormulario, string> = {
  claro: "Claro — fondo blanco (landings claras)",
  oscuro: "Oscuro — integrado con sitios dark (Geeks, careers)",
}

export function fontFamilyFormulario(tipografia: TipografiaFormulario): string | undefined {
  switch (tipografia) {
    case "inter":
      return "Inter, ui-sans-serif, system-ui, sans-serif"
    case "poppins":
      return "Poppins, ui-sans-serif, system-ui, sans-serif"
    case "outfit":
      return "Outfit, ui-sans-serif, system-ui, sans-serif"
    case "dm_sans":
      return '"DM Sans", ui-sans-serif, system-ui, sans-serif'
    default:
      return undefined
  }
}
