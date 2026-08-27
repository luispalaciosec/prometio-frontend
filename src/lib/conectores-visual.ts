/**
 * Catálogo visual de conectores: el único lugar con color de marca ajena.
 * No es paleta D. Los componentes solo consumen `id` + `CONECTOR_VISUAL`.
 */
export const CONECTOR_IDS = ["claude", "chatgpt", "gemini"] as const

export type ConectorId = (typeof CONECTOR_IDS)[number]

export const CONECTOR_VISUAL: Record<ConectorId, { well: string; label: string }> = {
  claude: {
    well: "bg-conector-claude/15 text-conector-claude",
    label: "Claude",
  },
  chatgpt: {
    well: "bg-conector-openai/15 text-conector-openai",
    label: "ChatGPT",
  },
  gemini: {
    well: "bg-linear-to-br from-conector-gemini-from/20 via-conector-gemini-via/20 to-conector-gemini-to/20 text-conector-gemini-via",
    label: "Gemini",
  },
}
